import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { PairPosFormat1 } from '../dist/table/PairPosFormat1.js';
import { PairPosFormat2 } from '../dist/table/PairPosFormat2.js';
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

function createThrowingPairLookup() {
  const p1 = Object.create(PairPosFormat1.prototype);
  p1.getKerning = () => { throw new Error('pair-format1-boom'); };
  const p2 = Object.create(PairPosFormat2.prototype);
  p2.getKerning = () => { throw new Error('pair-format2-boom'); };
  return {
    lookupList: {
      getLookups: () => [
        {
          getType: () => 2,
          getSubtableCount: () => 2,
          getSubtable: (i) => (i === 0 ? p1 : p2)
        }
      ]
    }
  };
}

test('kerning safety: TTF kern accessor should not throw if kern subtable throws', () => {
  const parser = createTtfParserMock();
  parser.kern = { getKerningValue: () => { throw new Error('kern-boom'); } };
  const value = parser.getKerningValueByGlyphs(1, 2);
  assert.equal(value, 0);
});

test('kerning safety: WOFF kern accessor should not throw if kern subtable throws', () => {
  const parser = createWoffParserMock();
  parser.kern = { getKerningValue: () => { throw new Error('kern-boom'); } };
  const value = parser.getKerningValueByGlyphs(1, 2);
  assert.equal(value, 0);
});

test('kerning safety: TTF GPOS kerning accessor should not throw when pair subtables throw', () => {
  const parser = createTtfParserMock();
  parser.gpos = createThrowingPairLookup();
  const value = parser.getGposKerningValueByGlyphs(10, 20);
  assert.equal(value, 0);
});

test('kerning safety: WOFF GPOS kerning accessor should not throw when pair subtables throw', () => {
  const parser = createWoffParserMock();
  parser.gpos = createThrowingPairLookup();
  const value = parser.getGposKerningValueByGlyphs(10, 20);
  assert.equal(value, 0);
});

test('kerning safety: TTF getKerningValue should stay safe when cmap returns non-numeric glyph index', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4, mapCharCode: () => 'oops' }],
    getCmapFormats: () => [{ getFormatType: () => 4, mapCharCode: () => 'oops' }]
  };
  parser.kern = { getKerningValue: () => 0 };
  const value = parser.getKerningValue('A', 'V');
  assert.equal(value, 0);
});

test('kerning safety: WOFF getKerningValue should stay safe when cmap returns non-numeric glyph index', () => {
  const parser = createWoffParserMock();
  parser.cmap = {
    formats: [{ getFormatType: () => 4, mapCharCode: () => 'oops' }],
    getCmapFormats: () => [{ getFormatType: () => 4, mapCharCode: () => 'oops' }]
  };
  parser.kern = { getKerningValue: () => 0 };
  const value = parser.getKerningValue('A', 'V');
  assert.equal(value, 0);
});

test('kerning safety: TTF kern accessor coerces NaN values to zero', () => {
  const parser = createTtfParserMock();
  parser.kern = { getKerningValue: () => Number.NaN };
  const value = parser.getKerningValueByGlyphs(10, 20);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('kerning safety: WOFF kern accessor coerces NaN values to zero', () => {
  const parser = createWoffParserMock();
  parser.kern = { getKerningValue: () => Number.NaN };
  const value = parser.getKerningValueByGlyphs(10, 20);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('kerning safety: LayoutEngine should not throw if getGlyph throws for one char', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar(ch) { return ch === 'X' ? 1 : 2; },
    getGlyph(idx) {
      if (idx === 1) throw new Error('glyph-boom');
      return { advanceWidth: 500 };
    },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return 0; }
  };
  assert.doesNotThrow(() => LayoutEngine.layoutText(font, 'XY'));
});

test('kerning safety: LayoutEngine should not throw if getGlyphIndexByChar throws for one char', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar(ch) {
      if (ch === 'X') throw new Error('gid-boom');
      return 2;
    },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return 0; }
  };
  assert.doesNotThrow(() => LayoutEngine.layoutText(font, 'XY'));
});

test('kerning safety: LayoutEngine should not throw if kerning callback throws', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { throw new Error('kern-boom'); }
  };
  assert.doesNotThrow(() => LayoutEngine.layoutText(font, 'AB', { useKerning: true }));
});

test('kerning safety: LayoutEngine should still return finite result with throwing kerning callback', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { throw new Error('kern-boom'); }
  };
  const out = LayoutEngine.layoutText(font, 'AB', { useKerning: false });
  assert.ok(Number.isFinite(out.width));
  assert.ok(Number.isFinite(out.height));
});
