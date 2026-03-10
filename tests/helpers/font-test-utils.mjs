import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../../dist/data/FontParser.js';
import { CanvasRenderer } from '../../dist/render/CanvasRenderer.js';
import { SVGFont } from '../../dist/render/SVGFont.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadFont(relativePath) {
  const fullPath = path.resolve(__dirname, '..', '..', relativePath);
  const data = fs.readFileSync(fullPath);
  return FontParser.fromArrayBuffer(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

export function width(font, text, options = {}) {
  return font.measureText(text, { gpos: true, ...options }).advanceWidth;
}

function makeCanvas() {
  return {
    getContext(kind) {
      if (kind !== '2d') return null;
      return {
        save() {},
        restore() {},
        translate() {},
        scale() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        quadraticCurveTo() {},
        bezierCurveTo() {},
        closePath() {},
        stroke() {},
        fill() {}
      };
    }
  };
}

export function svgWidth(font, text, options = {}) {
  const svg = SVGFont.exportStringSvg(font, text, options);
  const match = svg.match(/width="([^"]+)"/);
  return match ? Number(match[1]) : Number.NaN;
}

export function assertNear(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

export function captureCanvasXs(font, text, options = {}) {
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, drawOptions = {}) {
    xs.push(drawOptions.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, text, canvas, { scale: 1, x: 0, y: 0, ...options });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  return xs;
}

export function captureColorCanvasXs(font, text, options = {}) {
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, drawOptions = {}) {
    xs.push(drawOptions.x);
  };
  try {
    CanvasRenderer.drawColorString(font, text, canvas, { scale: 1, x: 0, y: 0, ...options });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  return xs;
}

export function expectedLayoutXs(font, text, options = {}) {
  const layout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true })
    : font.layoutString(text, { gpos: true });
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const spacing = Number.isFinite(options.spacing) ? options.spacing : 0;
  const out = [];
  let penX = Number.isFinite(options.x) ? options.x : 0;
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    out.push(penX + ((item.xOffset ?? 0) * scale));
    penX += item.xAdvance * scale;
    if (i < layout.length - 1) penX += spacing;
  }
  return out;
}

export function expectedKerningScaledXs(font, text, options = {}) {
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const spacing = Number.isFinite(options.spacing) ? options.spacing : 0;
  const kerningScale = Number.isFinite(options.kerningScale) ? options.kerningScale : 1;
  const originX = Number.isFinite(options.x) ? options.x : 0;
  const baseLayout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true, kerning: false })
    : font.layoutString(text, { gpos: true, kerning: false });
  const kernLayout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true, kerning: true })
    : font.layoutString(text, { gpos: true, kerning: true });
  assert.equal(baseLayout.length, kernLayout.length, 'expected comparable layouts for kerning interpolation');

  const out = [];
  let penX = originX;
  for (let i = 0; i < kernLayout.length; i++) {
    const baseItem = baseLayout[i];
    const kernItem = kernLayout[i];
    const xOffset = (baseItem.xOffset ?? 0) + (((kernItem.xOffset ?? 0) - (baseItem.xOffset ?? 0)) * kerningScale);
    const xAdvance = baseItem.xAdvance + ((kernItem.xAdvance - baseItem.xAdvance) * kerningScale);
    out.push(penX + (xOffset * scale));
    penX += xAdvance * scale;
    if (i < kernLayout.length - 1) penX += spacing;
  }
  return out;
}

export function layoutAdvance(font, text, options = {}) {
  const layout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, options)
    : font.layoutString(text, options);
  return layout.reduce((sum, item) => sum + item.xAdvance, 0);
}

export function kerningDelta(font, text) {
  return layoutAdvance(font, text, { gpos: true, kerning: true }) - layoutAdvance(font, text, { gpos: true, kerning: false });
}
