import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasRenderer } from '../dist/render/CanvasRenderer.js';

function makeContextWithOps() {
  const ops = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save() { ops.push(['save']); },
    restore() { ops.push(['restore']); },
    translate(x, y) { ops.push(['translate', x, y]); },
    scale(x, y) { ops.push(['scale', x, y]); },
    beginPath() { ops.push(['beginPath']); },
    moveTo(x, y) { ops.push(['moveTo', x, y]); },
    lineTo(x, y) { ops.push(['lineTo', x, y]); },
    quadraticCurveTo(cpx, cpy, x, y) { ops.push(['quadraticCurveTo', cpx, cpy, x, y]); },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { ops.push(['bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y]); },
    closePath() { ops.push(['closePath']); },
    stroke() { ops.push(['stroke']); },
    fill(rule) { ops.push(['fill', rule]); }
  };
  return { ctx, ops };
}

function makeCanvas(ctx) {
  return {
    getContext() {
      return ctx;
    }
  };
}

function glyphFromPoints(points, advanceWidth = 500, isCubic = false) {
  return {
    isCubic,
    advanceWidth,
    getPointCount() { return points.length; },
    getPoint(i) { return points[i] ?? null; }
  };
}

test('canvas renderer branches: applyCanvasStyles maps each style property', () => {
  const { ctx } = makeContextWithOps();
  CanvasRenderer.applyCanvasStyles(ctx, {
    fillStyle: '#abc',
    strokeStyle: '#def',
    globalAlpha: 0.5,
    lineWidth: 3,
    shadowColor: '#000',
    shadowBlur: 2,
    shadowOffsetX: 4,
    shadowOffsetY: 5
  });
  assert.equal(ctx.fillStyle, '#abc');
  assert.equal(ctx.strokeStyle, '#def');
  assert.equal(ctx.globalAlpha, 0.5);
  assert.equal(ctx.lineWidth, 3);
  assert.equal(ctx.shadowColor, '#000');
  assert.equal(ctx.shadowBlur, 2);
  assert.equal(ctx.shadowOffsetX, 4);
  assert.equal(ctx.shadowOffsetY, 5);
});

test('canvas renderer branches: addContourToShape covers quadratic branches and early return', () => {
  const { ctx, ops } = makeContextWithOps();
  const early = glyphFromPoints([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);
  CanvasRenderer.addContourToShape(ctx, early, 0, 1);
  assert.equal(ops.length, 0);

  const pOnOn = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 10, onCurve: true, endOfContour: true }
  ]);
  CanvasRenderer.addContourToShape(ctx, pOnOn, 0, 2);

  const pOnOffOn = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 15, onCurve: false, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);
  CanvasRenderer.addContourToShape(ctx, pOnOffOn, 0, 3);

  const pOnOffOff = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 15, onCurve: false, endOfContour: false },
    { x: 18, y: 12, onCurve: false, endOfContour: true }
  ]);
  CanvasRenderer.addContourToShape(ctx, pOnOffOff, 0, 3);

  const pOffOff = glyphFromPoints([
    { x: 1, y: 1, onCurve: false, endOfContour: false },
    { x: 5, y: 7, onCurve: false, endOfContour: true }
  ]);
  CanvasRenderer.addContourToShape(ctx, pOffOff, 0, 2);

  const pOffOn = glyphFromPoints([
    { x: 1, y: 1, onCurve: false, endOfContour: false },
    { x: 9, y: 2, onCurve: true, endOfContour: true }
  ]);
  CanvasRenderer.addContourToShape(ctx, pOffOn, 0, 2);

  assert.equal(ops.some((op) => op[0] === 'lineTo'), true);
  assert.equal(ops.some((op) => op[0] === 'quadraticCurveTo'), true);
});

test('canvas renderer branches: addContourToShape handles missing next points safely', () => {
  const { ctx, ops } = makeContextWithOps();
  const missingP2 = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 15, onCurve: false, endOfContour: false }
  ]);
  CanvasRenderer.addContourToShape(ctx, missingP2, 0, 3);
  assert.equal(ops.some((op) => op[0] === 'moveTo'), true);
});

test('canvas renderer branches: addContourToShapeCubic covers all cubic fallbacks', () => {
  const { ctx, ops } = makeContextWithOps();
  const p1OnCurve = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ], 500, true);
  CanvasRenderer.addContourToShapeCubic(ctx, p1OnCurve, 0, 2);

  const cubic = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 8, y: 12, onCurve: false, endOfContour: false },
    { x: 14, y: 12, onCurve: false, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ], 500, true);
  CanvasRenderer.addContourToShapeCubic(ctx, cubic, 0, 4);

  const dupControl = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 8, y: 12, onCurve: false, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ], 500, true);
  CanvasRenderer.addContourToShapeCubic(ctx, dupControl, 0, 3);

  const lineFallback = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 8, y: 12, onCurve: false, endOfContour: false }
  ], 500, true);
  CanvasRenderer.addContourToShapeCubic(ctx, lineFallback, 0, 2);

  assert.equal(ops.some((op) => op[0] === 'lineTo'), true);
  assert.equal(ops.some((op) => op[0] === 'bezierCurveTo'), true);
});

test('canvas renderer branches: drawGlyphToContext uses fillRule and cubic path branch', () => {
  const { ctx, ops } = makeContextWithOps();
  const glyph = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ], 500, true);
  CanvasRenderer.drawGlyphToContext(ctx, glyph, { x: 3, y: 4, scale: 2, fillRule: 'evenodd' });
  assert.equal(ops.some((op) => op[0] === 'translate' && op[1] === 3 && op[2] === 4), true);
  assert.equal(ops.some((op) => op[0] === 'fill' && op[1] === 'evenodd'), true);
});

test('canvas renderer branches: draw methods tolerate missing canvas context', () => {
  const noCtxCanvas = makeCanvas(null);
  const glyph = glyphFromPoints([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; },
    getGlyphIndexByChar() { return 1; }
  };
  assert.doesNotThrow(() => CanvasRenderer.drawString(font, 'a', noCtxCanvas, {}));
  assert.doesNotThrow(() => CanvasRenderer.drawStringWithKerning(font, 'a', noCtxCanvas, {}));
  assert.doesNotThrow(() => CanvasRenderer.drawGlyphIndices(font, [1], noCtxCanvas, {}));
  assert.doesNotThrow(() => CanvasRenderer.drawColorGlyph(font, 1, noCtxCanvas, {}));
  assert.doesNotThrow(() => CanvasRenderer.drawColorString(font, 'a', noCtxCanvas, {}));
  assert.doesNotThrow(() => CanvasRenderer.drawLayout(font, [{ glyphIndex: 1, xAdvance: 10 }], noCtxCanvas, {}));
});

test('canvas renderer branches: drawColorGlyph uses fallback glyph path when no layers exist', () => {
  const { ctx } = makeContextWithOps();
  const glyph = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ]);
  const font = {
    getGlyph() { return glyph; },
    getColorLayersForGlyph() { return []; },
    getColrV1LayersForGlyph() { return []; }
  };

  const original = CanvasRenderer.drawGlyphToContext;
  const calls = [];
  CanvasRenderer.drawGlyphToContext = (context, g, options = {}) => {
    calls.push({ context, g, options });
  };
  try {
    CanvasRenderer.drawColorGlyph(font, 7, makeCanvas(ctx), { x: 11, y: 12, scale: 1.5 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.x, 11);
  assert.equal(calls[0].options.y, 12);
  assert.equal(calls[0].options.scale, 1.5);
});

test('canvas renderer branches: drawColorGlyph fill fallback order and missing-layer glyph skip', () => {
  const { ctx } = makeContextWithOps();
  const glyph = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ]);
  const font = {
    getGlyph(id) { return id === 99 ? null : glyph; },
    getColorLayersForGlyph() {
      return [
        { glyphId: 99, color: '#aaa' },
        { glyphId: 1, color: null },
        { glyphId: 2, color: '#0f0' }
      ];
    }
  };

  const original = CanvasRenderer.drawGlyphToContext;
  const fills = [];
  CanvasRenderer.drawGlyphToContext = (context, g, options = {}) => {
    fills.push(options.styles?.fillStyle ?? null);
  };
  try {
    CanvasRenderer.drawColorGlyph(font, 3, makeCanvas(ctx), {
      fallbackFill: '#f00',
      styles: { fillStyle: '#00f' }
    });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }

  assert.deepEqual(fills, ['#f00', '#0f0']);
});

test('canvas renderer branches: drawColorString uses fallbackAdvance for non-positive advances', () => {
  const { ctx } = makeContextWithOps();
  const glyphZero = glyphFromPoints([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ], 0);
  const font = {
    getGlyphByChar() { return glyphZero; },
    getGlyphIndexByChar(ch) { return ch === 'A' ? 1 : null; },
    getGlyph() { return glyphZero; },
    getColorLayersForGlyph() { return []; }
  };

  const original = CanvasRenderer.drawGlyphToContext;
  const calls = [];
  CanvasRenderer.drawGlyphToContext = (context, glyph, options = {}) => {
    calls.push(options.x);
  };
  try {
    CanvasRenderer.drawColorString(font, 'AA', makeCanvas(ctx), {
      x: 0,
      y: 0,
      scale: 1,
      spacing: 0,
      fallbackAdvance: 123
    });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }

  assert.equal(calls.length, 2);
  assert.equal(calls[0], 0);
  assert.equal(calls[1], 123);
});
