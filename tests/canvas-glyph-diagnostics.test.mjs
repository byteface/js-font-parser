import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParser } from '../dist/data/FontParser.js';
import { CanvasGlyph } from '../dist/render/CanvasGlyph.js';

test('canvas glyph diagnostics: emits FONT_LOAD_FAILED when font loading fails', async () => {
  const originalLoad = FontParser.load;
  FontParser.load = async () => {
    throw new Error('synthetic-load-failure');
  };
  try {
    const canvasGlyph = new CanvasGlyph('/missing.ttf');
    await canvasGlyph.onFontLoaded();
    const diagnostics = canvasGlyph.getDiagnostics();
    assert.ok(diagnostics.some((diagnostic) => diagnostic.code === 'FONT_LOAD_FAILED'));
  } finally {
    FontParser.load = originalLoad;
  }
});

test('canvas glyph diagnostics: emits CANVAS_NOT_FOUND for missing canvas ids', async () => {
  const originalLoad = FontParser.load;
  const originalDocument = globalThis.document;
  FontParser.load = async () => ({
    getGlyphIndexByChar: () => 1,
    getGlyph: () => null,
    getGlyphByChar: () => null
  });
  globalThis.document = {
    getElementById: () => null
  };
  try {
    const canvasGlyph = new CanvasGlyph('/synthetic.ttf');
    await canvasGlyph.onFontLoaded();
    const context = canvasGlyph.drawGlyph(1, 'missing-canvas-id');
    assert.equal(context, null);
    const diagnostics = canvasGlyph.getDiagnostics();
    assert.ok(diagnostics.some((diagnostic) => diagnostic.code === 'CANVAS_NOT_FOUND'));
  } finally {
    FontParser.load = originalLoad;
    globalThis.document = originalDocument;
  }
});
