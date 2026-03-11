import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { MarkBasePosFormat1 } from '../dist/table/MarkBasePosFormat1.js';

function createTtfParserMock() {
  const parser = Object.create(FontParserTTF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

function createLayoutFontMock() {
  return {
    getTableByType(tag) {
      if (tag === 0x68656164) return { unitsPerEm: 1000 };
      if (tag === 0x68686561) return { ascender: 800, descender: -200, lineGap: 100 };
      return null;
    },
    getGlyphIndexByChar(ch) {
      if (!ch) return null;
      return ch.codePointAt(0) % 97 + 1;
    },
    getGlyphByChar(ch) {
      if (!ch) return null;
      return { advanceWidth: ch === ' ' ? 250 : 600 };
    },
    getGlyph(gid) {
      if (!gid) return null;
      return { advanceWidth: gid % 13 === 0 ? 250 : 600 };
    },
    getKerningValueByGlyphs() {
      return 0;
    }
  };
}

test('parser/cmap: astral cmap chooses usable glyph mapping when format 12 is available', () => {
  const parser = createTtfParserMock();
  const format4 = { getFormatType: () => 4, mapCharCode: () => 0 };
  const format12 = { getFormatType: () => 12, mapCharCode: () => 1234 };
  parser.cmap = {
    formats: [format4, format12],
    getCmapFormats(platformId, encodingId) {
      if (platformId === 3 && encodingId === 10) return [format4, format12];
      return [];
    }
  };

  assert.equal(parser.getGlyphIndexByChar('😀'), 1234);
});

test('parser/cmap: glyph index extraction remains stable for ZWJ emoji sequences', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [],
    getCmapFormats(platformId, encodingId) {
      if (platformId === 3 && encodingId === 10) {
        return [{
          getFormatType: () => 12,
          mapCharCode(cp) {
            if (cp === 0x200d) return 77;
            return 1000 + (cp % 100);
          }
        }];
      }
      return [];
    }
  };

  const glyphs = parser.getGlyphIndicesForString('👩‍🚀');
  assert.equal(glyphs.length, 3);
  assert.ok(glyphs.every((glyph) => Number.isInteger(glyph) && glyph > 0));
});

test('parser/layout: layoutString does not double-apply kerning when kern and gpos both exist', () => {
  const parser = createTtfParserMock();
  parser.getGlyphIndicesForStringWithGsub = () => [10, 11];
  parser.getGlyph = () => ({ advanceWidth: 500 });
  parser.getKerningValueByGlyphs = () => -50;
  parser.getGposKerningValueByGlyphs = () => -30;

  const positioned = parser.layoutString('AV');
  assert.equal(positioned.length, 2);
  assert.equal(positioned[0].xAdvance, 450);
  assert.equal(positioned[1].xAdvance, 500);
});

test('parser/layout: mark attachment with class mismatch leaves offsets finite and unchanged', () => {
  const parser = createTtfParserMock();
  parser.gpos = {
    getSubtablesForFeatures: () => [Object.create(MarkBasePosFormat1.prototype)]
  };
  parser.gdef = {
    getGlyphClass(gid) {
      return gid === 20 ? 3 : 1;
    }
  };
  parser.getMarkAnchorsForGlyph = (gid) => {
    if (gid === 20) return [{ type: 'mark', classIndex: 1, x: 120, y: 240 }];
    if (gid === 10) return [{ type: 'base', classIndex: 0, x: 80, y: 220 }];
    return [];
  };

  const glyphIndices = [10, 20];
  const positioned = [
    { glyphIndex: 10, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 20, xAdvance: 0, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  parser.applyGposPositioning(glyphIndices, positioned, ['mark'], ['DFLT']);
  assert.equal(positioned[1].xOffset, 0);
  assert.equal(positioned[1].yOffset, 0);
  assert.ok(Number.isFinite(positioned[1].xOffset));
  assert.ok(Number.isFinite(positioned[1].yOffset));
});

test('parser/layout: gvar phantom-only deltas update metrics without moving outline points', () => {
  const parser = createTtfParserMock();
  const description = {
    getPointCount: () => 2,
    getContourCount: () => 1,
    getEndPtOfContours: () => 1,
    getFlags: () => 1,
    getXCoordinate: (point) => (point === 0 ? 10 : 30),
    getYCoordinate: (point) => (point === 0 ? 40 : 60),
    getXMaximum: () => 30,
    getXMinimum: () => 10,
    getYMaximum: () => 60,
    getYMinimum: () => 40,
    isComposite: () => false,
    resolve: () => {}
  };

  parser.glyf = { getDescription: () => description };
  parser.hmtx = {
    getLeftSideBearing: () => 10,
    getAdvanceWidth: () => 100
  };
  parser.variationCoords = [0.5];
  parser.gvar = {
    getDeltasForGlyph: () => ({
      dx: [0, 0, 5, 25],
      dy: [0, 0, 0, 0],
      touched: [false, false]
    })
  };

  const glyph = parser.getGlyph(0);
  assert.equal(glyph.leftSideBearing, 15);
  assert.equal(glyph.advanceWidth, 120);
  assert.equal(glyph.getPoint(0).x, 10);
  assert.equal(glyph.getPoint(1).x, 30);
});

test('parser/layout: simple gvar glyphs use IUP-interpolated deltas for untouched points', () => {
  const parser = createTtfParserMock();
  const description = {
    getPointCount: () => 4,
    getContourCount: () => 1,
    getEndPtOfContours: () => 3,
    getFlags: () => 1,
    getXCoordinate: (point) => [0, 10, 20, 30][point],
    getYCoordinate: () => 0,
    getXMaximum: () => 30,
    getXMinimum: () => 0,
    getYMaximum: () => 0,
    getYMinimum: () => 0,
    isComposite: () => false,
    resolve: () => {}
  };

  parser.glyf = { getDescription: () => description };
  parser.hmtx = {
    getLeftSideBearing: () => 0,
    getAdvanceWidth: () => 100
  };
  parser.variationCoords = [0.5];
  parser.gvar = {
    getDeltasForGlyph: () => ({
      dx: [0, 0, 0, 30, 0, 0],
      dy: [0, 0, 0, 0, 0, 0],
      touched: [true, false, false, true]
    })
  };

  const glyph = parser.getGlyph(0);
  assert.ok(glyph);
  assert.equal(glyph.getPoint(0).x, 0);
  assert.equal(glyph.getPoint(1).x, 20);
  assert.equal(glyph.getPoint(2).x, 40);
  assert.equal(glyph.getPoint(3).x, 60);
});

test('layout engine: mixed bidi with soft hyphen and newline stays deterministic', () => {
  const font = createLayoutFontMock();
  const text = 'אבג hyphen\u00ADation\nXYZ שלום';
  const options = {
    maxWidth: 1600,
    direction: 'rtl',
    bidi: 'full',
    hyphenate: 'soft',
    hyphenChar: '-',
    trimLeadingSpaces: true,
    trimTrailingSpaces: true
  };

  const first = LayoutEngine.layoutText(font, text, options);
  const second = LayoutEngine.layoutText(font, text, options);
  assert.deepEqual(first, second);
  assert.ok(first.lines.length >= 2);
  assert.ok(first.lines.every((line) => Number.isFinite(line.width)));
});

test('parser diagnostics: repeated multi-char input emits one deduplicated warning', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [],
    getCmapFormats: () => []
  };

  parser.getGlyphIndexByChar('abc');
  parser.getGlyphIndexByChar('def');
  const warnings = parser.getDiagnostics({ code: 'MULTI_CHAR_INPUT' });
  assert.equal(warnings.length, 1);
});

test('kerning safety: kern table null return is coerced to zero', () => {
  const parser = createTtfParserMock();
  parser.kern = { getKerningValue: () => null };
  const value = parser.getKerningValueByGlyphs(11, 22);
  assert.equal(value, 0);
  assert.ok(Number.isFinite(value));
});
