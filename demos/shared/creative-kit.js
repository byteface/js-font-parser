import { getFontList } from '../../tools/shared/font-catalog.js';

const CORE = getFontList('demoCore');
const EXTRA = [
  ...getFontList('variableFonts').slice(0, 3),
  ...getFontList('kerning').slice(0, 2)
];

export const CREATIVE_FONTS = [...CORE, ...EXTRA].filter(
  (f, i, arr) => arr.findIndex((x) => x.url === f.url) === i
);

const fontCache = new Map();

export function populateCreativeFonts(select) {
  if (!select) return;
  select.innerHTML = '';
  for (const f of CREATIVE_FONTS) {
    const opt = document.createElement('option');
    opt.value = f.url;
    opt.textContent = f.name;
    select.appendChild(opt);
  }
}

export async function loadFontByUrl(url) {
  const { FontParser } = window.FontParser;
  if (fontCache.has(url)) return fontCache.get(url);
  const font = await FontParser.load(url);
  fontCache.set(url, font);
  return font;
}

function collectRawPoints(glyph) {
  const points = [];
  if (Array.isArray(glyph?.points) && glyph.points.length > 0) {
    for (const p of glyph.points) {
      points.push({ x: p.x, y: p.y, endOfContour: !!p.endOfContour, onCurve: !!p.onCurve });
    }
    return points;
  }
  if (!glyph || typeof glyph.getPointCount !== 'function') return points;
  for (let i = 0; i < glyph.getPointCount(); i++) {
    const p = glyph.getPoint(i);
    points.push({ x: p.x, y: p.y, endOfContour: !!p.endOfContour, onCurve: !!p.onCurve });
  }
  return points;
}

function splitContours(points) {
  const contours = [];
  let current = [];
  for (const p of points) {
    current.push(p);
    if (p.endOfContour) {
      contours.push(current);
      current = [];
    }
  }
  if (current.length) contours.push(current);
  return contours.filter((c) => c.length > 1);
}

export function getGlyphGeometry(font, char, options = {}) {
  const glyph = font.getGlyphByChar(char) || font.getGlyphByChar('A');
  if (!glyph) {
    return { points: [], contours: [], bounds: null, advance: 0, glyph: null };
  }

  const unitsPerEm = typeof font.getUnitsPerEm === 'function' ? font.getUnitsPerEm() : 1000;
  const sizePx = Number(options.sizePx || 340);
  const scale = sizePx / unitsPerEm;
  const raw = collectRawPoints(glyph);
  const points = raw.map((p) => ({ ...p, x: p.x * scale, y: -p.y * scale }));

  if (!points.length) {
    return { points: [], contours: [], bounds: null, advance: 0, glyph };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const targetCx = Number(options.centerX ?? 0);
  const targetCy = Number(options.centerY ?? 0);
  const gx = minX + width * 0.5;
  const gy = minY + height * 0.5;
  const dx = targetCx - gx;
  const dy = targetCy - gy;

  for (const p of points) {
    p.x += dx;
    p.y += dy;
  }

  const contours = splitContours(points);
  const advance = (glyph.advanceWidth || width) * scale;

  return {
    glyph,
    points,
    contours,
    advance,
    bounds: {
      minX: minX + dx,
      maxX: maxX + dx,
      minY: minY + dy,
      maxY: maxY + dy,
      width,
      height,
      cx: targetCx,
      cy: targetCy
    }
  };
}

export function drawContoursPath2D(ctx, contours, closePath = true) {
  ctx.beginPath();
  for (const contour of contours) {
    if (!contour || contour.length === 0) continue;
    ctx.moveTo(contour[0].x, contour[0].y);
    for (let i = 1; i < contour.length; i++) {
      ctx.lineTo(contour[i].x, contour[i].y);
    }
    if (closePath) ctx.closePath();
  }
}

export function flattenContours(contours) {
  const out = [];
  for (const contour of contours) {
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i];
      const b = contour[(i + 1) % contour.length];
      out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len: Math.hypot(b.x - a.x, b.y - a.y) || 1 });
    }
  }
  return out;
}

export function sampleAlongSegments(segments, t) {
  if (!segments.length) return { x: 0, y: 0, angle: 0 };
  const total = segments.reduce((acc, s) => acc + s.len, 0) || 1;
  let d = ((t % 1) + 1) % 1 * total;
  for (const s of segments) {
    if (d <= s.len) {
      const u = s.len > 0 ? d / s.len : 0;
      return {
        x: s.x1 + (s.x2 - s.x1) * u,
        y: s.y1 + (s.y2 - s.y1) * u,
        angle: Math.atan2(s.y2 - s.y1, s.x2 - s.x1)
      };
    }
    d -= s.len;
  }
  const last = segments[segments.length - 1];
  return { x: last.x2, y: last.y2, angle: Math.atan2(last.y2 - last.y1, last.x2 - last.x1) };
}
