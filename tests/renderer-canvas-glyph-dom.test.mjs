import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasGlyph } from '../dist/render/CanvasGlyph.js';
import { FontParser } from '../dist/data/FontParser.js';

test('canvas glyph DOM: CanvasGlyph.drawGlyph should not throw for non-canvas DOM nodes', async () => {
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

test('canvas glyph DOM: CanvasGlyph drawString variants should not throw for non-canvas DOM nodes', async () => {
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

test('canvas glyph DOM: CanvasGlyph no longer exposes legacy jitter API surface', async () => {
  const originalLoad = FontParser.load;
  FontParser.load = async () => ({
    getGlyphIndexByChar: () => 1,
    getGlyph: () => null,
    getGlyphByChar: () => null
  });
  try {
    const canvasGlyph = new CanvasGlyph('/synthetic.ttf');
    await canvasGlyph.onFontLoaded();
    assert.equal(typeof canvasGlyph.setJitter, 'undefined');
    assert.equal(typeof canvasGlyph.addContourToShapeJitter, 'undefined');
  } finally {
    FontParser.load = originalLoad;
  }
});
