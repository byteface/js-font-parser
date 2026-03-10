import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasGlyph } from '../dist/render/CanvasGlyph.js';
import { FontParser } from '../dist/data/FontParser.js';

test('round10 edge: CanvasGlyph.drawGlyph should not throw for non-canvas DOM nodes', async () => {
  const originalLoad = FontParser.load;
  const originalDocument = globalThis.document;
  FontParser.load = async () => ({
    getGlyphIndexByChar: () => 1,
    getGlyph: () => null,
    getGlyphByChar: () => null
  });
  globalThis.document = { getElementById: () => ({}) };
  try {
    const canvasGlyph = new CanvasGlyph('/synthetic.ttf');
    await canvasGlyph.onFontLoaded();
    assert.doesNotThrow(() => canvasGlyph.drawGlyph(1, 'not-a-canvas'));
    assert.equal(canvasGlyph.drawGlyph(1, 'not-a-canvas'), null);
  } finally {
    FontParser.load = originalLoad;
    globalThis.document = originalDocument;
  }
});

test('round10 edge: CanvasGlyph drawString variants should not throw for non-canvas DOM nodes', async () => {
  const originalLoad = FontParser.load;
  const originalDocument = globalThis.document;
  FontParser.load = async () => ({
    getGlyphIndexByChar: () => 1,
    getGlyph: () => ({
      advanceWidth: 500,
      isCubic: false,
      getPointCount: () => 1,
      getPoint: () => ({ x: 0, y: 0, onCurve: true, endOfContour: true })
    }),
    getGlyphByChar: () => ({
      advanceWidth: 500,
      isCubic: false,
      getPointCount: () => 1,
      getPoint: () => ({ x: 0, y: 0, onCurve: true, endOfContour: true })
    }),
    getKerningValue: () => 0
  });
  globalThis.document = { getElementById: () => ({}) };
  try {
    const canvasGlyph = new CanvasGlyph('/synthetic.ttf');
    await canvasGlyph.onFontLoaded();
    assert.doesNotThrow(() => canvasGlyph.drawString('AB', 'not-a-canvas'));
    assert.doesNotThrow(() => canvasGlyph.drawStringWithKerning('AB', 'not-a-canvas'));
    assert.doesNotThrow(() => canvasGlyph.drawLayout([{ glyphIndex: 1, xAdvance: 500 }], 'not-a-canvas'));
  } finally {
    FontParser.load = originalLoad;
    globalThis.document = originalDocument;
  }
});

test('round10 edge: CanvasGlyph jitter uses yShift for p2.y in quadratic segment', async () => {
  const originalLoad = FontParser.load;
  FontParser.load = async () => ({
    getGlyphIndexByChar: () => 1,
    getGlyph: () => null,
    getGlyphByChar: () => null
  });
  try {
    const canvasGlyph = new CanvasGlyph('/synthetic.ttf');
    await canvasGlyph.onFontLoaded();
    canvasGlyph.setJitter(10);

    const calls = [];
    const context = {
      moveTo() {},
      lineTo() {},
      quadraticCurveTo(...args) { calls.push(args); }
    };
    const glyph = {
      getPoint(i) {
        const points = [
          { x: 0, y: 0, onCurve: true, endOfContour: false },
          { x: 10, y: 20, onCurve: false, endOfContour: false },
          { x: 30, y: 40, onCurve: true, endOfContour: true }
        ];
        return points[i] ?? null;
      }
    };

    const originalRandom = Math.random;
    const seq = [1, 0, 0, 1, 0, 0, 0, 1];
    let idx = 0;
    Math.random = () => seq[idx++] ?? 0;
    try {
      canvasGlyph.addContourToShapeJitter(context, glyph, 0, 3, 1);
    } finally {
      Math.random = originalRandom;
    }

    assert.equal(calls.length > 0, true);
    const [, , , endY] = calls[0];
    assert.equal(endY, 30);
  } finally {
    FontParser.load = originalLoad;
  }
});
