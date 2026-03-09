export function collectGlyphPoints(glyph) {
  if (!glyph) return [];
  if (Array.isArray(glyph.points) && glyph.points.length > 0) {
    return glyph.points.map((p) => ({
      x: p.x,
      y: p.y,
      onCurve: !!p.onCurve,
      endOfContour: !!p.endOfContour
    }));
  }
  const out = [];
  const count = typeof glyph.getPointCount === 'function' ? glyph.getPointCount() : 0;
  for (let i = 0; i < count; i++) {
    const p = glyph.getPoint(i);
    if (!p) continue;
    out.push({
      x: p.x,
      y: p.y,
      onCurve: !!p.onCurve,
      endOfContour: !!p.endOfContour
    });
  }
  return out;
}

export function splitContours(points) {
  const contours = [];
  let current = [];
  for (const p of points) {
    current.push(p);
    if (p.endOfContour) {
      if (current.length > 1) contours.push(current);
      current = [];
    }
  }
  if (current.length > 1) contours.push(current);
  return contours;
}

function quad(a, b, c, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y
  };
}

export function drawContourPath(ctx, contour) {
  if (!contour || contour.length < 2) return;
  let offset = 0;
  const count = contour.length;
  const get = (i) => contour[(i + count) % count];

  const p0 = get(0);
  ctx.moveTo(p0.x, p0.y);

  while (offset < count) {
    const a = get(offset);
    const b = get(offset + 1);
    if (a.onCurve) {
      if (b.onCurve) {
        ctx.lineTo(b.x, b.y);
        offset++;
      } else {
        const c = get(offset + 2);
        if (c.onCurve) {
          ctx.quadraticCurveTo(b.x, b.y, c.x, c.y);
        } else {
          ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) * 0.5, (b.y + c.y) * 0.5);
        }
        offset += 2;
      }
    } else {
      if (!b.onCurve) {
        ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
      } else {
        ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
      }
      offset++;
    }
  }
  ctx.closePath();
}

export function drawGlyphPath(ctx, contours) {
  ctx.beginPath();
  for (const contour of contours) drawContourPath(ctx, contour);
}

export function sampleContour(contour, curveStep = 0.12) {
  if (!contour || contour.length < 2) return [];
  const points = [];
  const count = contour.length;
  const get = (i) => contour[(i + count) % count];
  let offset = 0;
  while (offset < count) {
    const a = get(offset);
    const b = get(offset + 1);
    if (a.onCurve) {
      if (b.onCurve) {
        points.push({ x: b.x, y: b.y, isNode: true });
        offset++;
      } else {
        const c = get(offset + 2);
        const end = c.onCurve ? c : { x: (b.x + c.x) * 0.5, y: (b.y + c.y) * 0.5 };
        for (let t = curveStep; t <= 1.00001; t += curveStep) {
          const p = quad(a, b, end, Math.min(1, t));
          points.push({ x: p.x, y: p.y, isNode: Math.abs(t - 1) < 0.001 });
        }
        offset += 2;
      }
    } else {
      const end = b.onCurve ? b : { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
      for (let t = curveStep; t <= 1.00001; t += curveStep) {
        const p = quad(a, a, end, Math.min(1, t));
        points.push({ x: p.x, y: p.y, isNode: Math.abs(t - 1) < 0.001 });
      }
      offset++;
    }
  }
  return points;
}

export function getBounds(points) {
  if (!points.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function transformPoints(points, tx, ty, scale, flipY = true) {
  return points.map((p) => ({
    ...p,
    x: tx + p.x * scale,
    y: ty + (flipY ? -p.y : p.y) * scale
  }));
}
