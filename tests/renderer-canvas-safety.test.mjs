import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasRenderer } from '../dist/render/CanvasRenderer.js';

function makeGlyph(advanceWidth = 500) {
  const points = [
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 100, y: 0, onCurve: true, endOfContour: false },
    { x: 100, y: 100, onCurve: true, endOfContour: true }
  ];
  return {
    advanceWidth,
    isCubic: false,
    getPointCount() { return points.length; },
    getPoint(i) { return points[i] ?? null; }
  };
}

function makeContext() {
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

function makeCanvas(ctx = makeContext()) {
  return {
    getContext() {
      return ctx;
    }
  };
}

function withDrawSpy(fn) {
  const original = CanvasRenderer.drawGlyphToContext;
  const calls = [];
  CanvasRenderer.drawGlyphToContext = (context, glyph, options = {}) => {
    calls.push({ context, glyph, options });
  };
  try {
    fn(calls);
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
}

test('canvas renderer safety: drawString should keep finite glyph x positions when spacing is NaN', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawString(font, 'AB', makeCanvas(), { x: 0, y: 0, scale: 1, spacing: Number.NaN });
    assert.equal(calls.length, 2);
    assert.equal(Number.isFinite(calls[0].options.x), true);
    assert.equal(Number.isFinite(calls[1].options.x), true);
    assert.equal(calls[1].options.x, 500);
  });
});

test('canvas renderer safety: drawStringWithKerning should keep finite positions when kerning callback returns NaN', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; },
    getKerningValue() { return Number.NaN; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawStringWithKerning(font, 'AB', makeCanvas(), { x: 0, y: 0, scale: 1, spacing: 0 });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.x, 500);
  });
});

test('canvas renderer safety: drawStringWithKerning should keep finite positions when kerning callback throws', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; },
    getKerningValue() { throw new Error('kern-boom'); }
  };

  withDrawSpy((calls) => {
    assert.doesNotThrow(() => CanvasRenderer.drawStringWithKerning(font, 'AB', makeCanvas(), { x: 0, y: 0, scale: 1, spacing: 0 }));
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.x, 500);
  });
});

test('canvas renderer safety: drawLayout should keep finite positions with non-finite advances/offsets', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawLayout(font, [
      { glyphIndex: 1, xAdvance: Number.NaN, xOffset: Number.NaN, yOffset: Number.NaN },
      { glyphIndex: 2, xAdvance: Number.POSITIVE_INFINITY, xOffset: 0, yOffset: 0 }
    ], makeCanvas(), { x: 0, y: 0, scale: 1 });

    assert.equal(calls.length, 2);
    assert.equal(Number.isFinite(calls[0].options.x), true);
    assert.equal(Number.isFinite(calls[0].options.y), true);
    assert.equal(Number.isFinite(calls[1].options.x), true);
  });
});

test('canvas renderer safety: drawStringWithKerning should treat astral chars as single glyph units', () => {
  const glyph = makeGlyph(700);
  const astral = '😀';
  const font = {
    getGlyphByChar(ch) {
      return ch === astral ? glyph : null;
    },
    getGlyph() { return glyph; },
    getKerningValue() { return 0; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawStringWithKerning(font, astral, makeCanvas(), { x: 0, y: 0, scale: 1, spacing: 0 });
    assert.equal(calls.length, 1);
  });
});

test('canvas renderer safety: drawString should treat astral chars as single glyph units', () => {
  const glyph = makeGlyph(700);
  const astral = '😀';
  const font = {
    getGlyphByChar(ch) {
      return ch === astral ? glyph : null;
    },
    getGlyph() { return glyph; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawString(font, astral, makeCanvas(), { x: 0, y: 0, scale: 1, spacing: 0 });
    assert.equal(calls.length, 1);
  });
});

test('canvas renderer safety: drawColorString should keep finite positions when spacing is NaN', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return glyph; },
    getColorLayersForGlyph() { return []; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawColorString(font, 'AB', makeCanvas(), { x: 0, y: 0, scale: 1, spacing: Number.NaN });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.x, 500);
  });
});

test('canvas renderer safety: drawColorGlyph should not throw when color layer getter throws', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; },
    getColorLayersForGlyph() { throw new Error('colr-boom'); },
    getColrV1LayersForGlyph() { return []; }
  };

  assert.doesNotThrow(() => CanvasRenderer.drawColorGlyph(font, 1, makeCanvas(), { x: 0, y: 0, scale: 1 }));
});

test('canvas renderer safety: drawGlyphIndices should keep finite x positions with NaN spacing', () => {
  const glyph = makeGlyph(400);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawGlyphIndices(font, [1, 2, 3], makeCanvas(), { x: 0, y: 0, scale: 1, spacing: Number.NaN });
    assert.equal(calls.length, 3);
    assert.equal(calls[0].options.x, 0);
    assert.equal(calls[1].options.x, 400);
    assert.equal(calls[2].options.x, 800);
  });
});

test('canvas renderer safety: drawStringWithKerning should keep finite positions when scale is NaN', () => {
  const glyph = makeGlyph(500);
  const font = {
    getGlyphByChar() { return glyph; },
    getGlyph() { return glyph; },
    getKerningValue() { return 0; }
  };

  withDrawSpy((calls) => {
    CanvasRenderer.drawStringWithKerning(font, 'AB', makeCanvas(), { x: 0, y: 0, scale: Number.NaN, spacing: 0 });
    assert.equal(calls.length, 2);
    assert.equal(Number.isFinite(calls[0].options.scale), true);
    assert.equal(Number.isFinite(calls[1].options.x), true);
  });
});
