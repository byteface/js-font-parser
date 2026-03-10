import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';

function createTtfParserMock() {
  const parser = Object.create(FontParserTTF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

function createWoffParserMock() {
  const parser = Object.create(FontParserWOFF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

test('round6 edge: TTF getGlyphIndexByChar should not throw for cmap formats missing map functions', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4 }],
    getCmapFormats: () => [{ getFormatType: () => 4 }]
  };
  assert.doesNotThrow(() => parser.getGlyphIndexByChar('A'));
  assert.equal(parser.getGlyphIndexByChar('A'), null);
});

test('round6 edge: WOFF getGlyphIndexByChar should not throw for cmap formats missing map functions', () => {
  const parser = createWoffParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4 }],
    getCmapFormats: () => [{ getFormatType: () => 4 }]
  };
  assert.doesNotThrow(() => parser.getGlyphIndexByChar('A'));
  assert.equal(parser.getGlyphIndexByChar('A'), null);
});

test('round6 edge: TTF getGlyphIndexByChar should tolerate throwing cmap format selection', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4, mapCharCode: () => 1 }],
    getCmapFormats: () => { throw new Error('cmap-boom'); }
  };
  assert.doesNotThrow(() => parser.getGlyphIndexByChar('A'));
  assert.equal(parser.getGlyphIndexByChar('A'), 1);
});

test('round6 edge: WOFF getGlyphIndexByChar should tolerate throwing cmap format selection', () => {
  const parser = createWoffParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4, mapCharCode: () => 1 }],
    getCmapFormats: () => { throw new Error('cmap-boom'); }
  };
  assert.doesNotThrow(() => parser.getGlyphIndexByChar('A'));
  assert.equal(parser.getGlyphIndexByChar('A'), 1);
});

test('round6 edge: LayoutEngine should not throw if getTableByType callback throws', () => {
  const font = {
    getTableByType() { throw new Error('table-boom'); },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return 0; }
  };
  assert.doesNotThrow(() => LayoutEngine.layoutText(font, 'AB'));
});

test('round6 edge: LayoutEngine should keep finite lineHeight when table metrics are NaN', () => {
  const font = {
    getTableByType(tag) {
      if (tag === 0x68656164) return { unitsPerEm: Number.NaN };
      if (tag === 0x68686561) return { ascender: Number.NaN, descender: Number.NaN, lineGap: Number.NaN };
      return null;
    },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return 0; }
  };
  const out = LayoutEngine.layoutText(font, 'A\nB');
  assert.ok(Number.isFinite(out.lineHeight));
  assert.ok(Number.isFinite(out.height));
});

test('round6 edge: TTF measureText should keep finite width when letterSpacing is NaN', () => {
  const parser = createTtfParserMock();
  parser.layoutString = () => [
    { glyphIndex: 1, xAdvance: 400, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 2, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];
  const out = parser.measureText('AB', { letterSpacing: Number.NaN });
  assert.ok(Number.isFinite(out.advanceWidth));
  assert.equal(out.advanceWidth, 900);
});

test('round6 edge: WOFF measureText should keep finite width when letterSpacing is NaN', () => {
  const parser = createWoffParserMock();
  parser.layoutString = () => [
    { glyphIndex: 1, xAdvance: 400, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 2, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];
  const out = parser.measureText('AB', { letterSpacing: Number.NaN });
  assert.ok(Number.isFinite(out.advanceWidth));
  assert.equal(out.advanceWidth, 900);
});

function makePointGlyph() {
  return {
    getPointCount: () => 1,
    getPoint: () => ({ x: 10, y: 20, onCurve: true, endOfContour: true })
  };
}

test('round6 edge: TTF layoutToPoints should keep finite scale with unitsPerEm=0 and NaN options', () => {
  const parser = createTtfParserMock();
  parser.getUnitsPerEm = () => 0;
  parser.layoutString = () => [{ glyphIndex: 1, xAdvance: 400, xOffset: 0, yOffset: 0, yAdvance: 0 }];
  parser.getGlyph = () => makePointGlyph();
  const out = parser.layoutToPoints('A', { fontSize: Number.NaN, letterSpacing: Number.NaN, x: 0, y: 0 });
  assert.ok(Number.isFinite(out.scale));
  assert.ok(Number.isFinite(out.advanceWidth));
  assert.ok(Number.isFinite(out.points[0].x));
  assert.ok(Number.isFinite(out.points[0].y));
});

test('round6 edge: WOFF layoutToPoints should keep finite scale with unitsPerEm=0 and NaN options', () => {
  const parser = createWoffParserMock();
  parser.getUnitsPerEm = () => 0;
  parser.layoutString = () => [{ glyphIndex: 1, xAdvance: 400, xOffset: 0, yOffset: 0, yAdvance: 0 }];
  parser.getGlyph = () => makePointGlyph();
  const out = parser.layoutToPoints('A', { fontSize: Number.NaN, letterSpacing: Number.NaN, x: 0, y: 0 });
  assert.ok(Number.isFinite(out.scale));
  assert.ok(Number.isFinite(out.advanceWidth));
  assert.ok(Number.isFinite(out.points[0].x));
  assert.ok(Number.isFinite(out.points[0].y));
});
