import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { MarkBasePosFormat1 } from '../dist/table/MarkBasePosFormat1.js';

function createTtfParserMock() {
  const parser = Object.create(FontParserTTF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

function makeMinimalWoffTwoTableBuffer(entryA, entryB, { length = 160, totalSfntSize = 192 } = {}) {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // WOFF header
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false); // sfnt flavor
  view.setUint32(8, length, false);
  view.setUint16(12, 2, false); // numTables
  view.setUint16(14, 0, false);
  view.setUint32(16, totalSfntSize, false);
  view.setUint16(20, 1, false);
  view.setUint16(22, 0, false);

  const entries = [entryA, entryB];
  entries.forEach((entry, i) => {
    const o = 44 + i * 20;
    view.setUint32(o, entry.tag, false);
    view.setUint32(o + 4, entry.offset, false);
    view.setUint32(o + 8, entry.compLength, false);
    view.setUint32(o + 12, entry.origLength, false);
    view.setUint32(o + 16, entry.checksum ?? 0, false);
    for (let p = entry.offset; p < entry.offset + entry.compLength && p < bytes.length; p++) {
      bytes[p] = i === 0 ? 0xaa : 0xbb;
    }
  });

  return new Uint8Array(buffer);
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

test('edge: astral cmap chooses usable glyph mapping when format 12 is available', () => {
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

  const glyph = parser.getGlyphIndexByChar('😀');
  assert.equal(glyph, 1234);
});

test('edge: glyph index extraction remains stable for ZWJ emoji sequence', () => {
  const parser = createTtfParserMock();
  parser.cmap = {
    formats: [],
    getCmapFormats(platformId, encodingId) {
      if (platformId === 3 && encodingId === 10) {
        return [{
          getFormatType: () => 12,
          mapCharCode(cp) {
            if (cp === 0x200d) return 77; // ZWJ should map deterministically if present
            return 1000 + (cp % 100);
          }
        }];
      }
      return [];
    }
  };

  const glyphs = parser.getGlyphIndicesForString('👩‍🚀');
  assert.equal(glyphs.length, 3);
  assert.ok(glyphs.every((g) => Number.isInteger(g) && g > 0));
});

test('edge: layoutString does not double-apply kerning when kern and gpos both exist', () => {
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

test('edge: mark attachment with class mismatch leaves offsets finite and unchanged', () => {
  const parser = createTtfParserMock();
  parser.gpos = {
    getSubtablesForFeatures: () => [Object.create(MarkBasePosFormat1.prototype)]
  };
  parser.gdef = {
    getGlyphClass(gid) {
      return gid === 20 ? 3 : 1; // mark for 20, base for 10
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
  assert.ok(Number.isFinite(positioned[1].xOffset) && Number.isFinite(positioned[1].yOffset));
});

test('edge: gvar phantom-only deltas update metrics without moving outline points', () => {
  const parser = createTtfParserMock();
  const description = {
    getPointCount: () => 2,
    getContourCount: () => 1,
    getEndPtOfContours: () => 1,
    getFlags: () => 1,
    getXCoordinate: (p) => (p === 0 ? 10 : 30),
    getYCoordinate: (p) => (p === 0 ? 40 : 60),
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

test('edge: WOFF decode rejects overlapping table byte ranges', () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 96, compLength: 24, origLength: 24 }, // head
    { tag: 0x68686561, offset: 108, compLength: 24, origLength: 24 } // hhea overlaps [108,120)
  );
  assert.throws(
    () => FontParserWOFF.decodeWoffToSfntSync(bytes),
    /overlap|invalid|offset|table/i
  );
});

test('edge: WOFF decode accepts adjacent non-overlapping table byte ranges', () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 96, compLength: 24, origLength: 24 },
    { tag: 0x68686561, offset: 120, compLength: 24, origLength: 24 }
  );
  const sfnt = FontParserWOFF.decodeWoffToSfntSync(bytes);
  assert.ok(sfnt instanceof Uint8Array);
  assert.ok(sfnt.length >= 44);
});

test('edge: LayoutEngine mixed bidi + soft hyphen + newline is deterministic', () => {
  const font = createLayoutFontMock();
  const text = 'אבג hyphen\u00ADation\nXYZ שלום';
  const opts = {
    maxWidth: 1600,
    direction: 'rtl',
    bidi: 'full',
    hyphenate: 'soft',
    hyphenChar: '-',
    trimLeadingSpaces: true,
    trimTrailingSpaces: true
  };
  const a = LayoutEngine.layoutText(font, text, opts);
  const b = LayoutEngine.layoutText(font, text, opts);
  assert.deepEqual(a, b);
  assert.ok(a.lines.length >= 2);
  assert.ok(a.lines.every((line) => Number.isFinite(line.width)));
});

test('edge: repeated multi-char input emits one deduplicated diagnostic', () => {
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

test('edge: kern table null return is coerced to 0 (not NaN)', () => {
  const parser = createTtfParserMock();
  parser.kern = { getKerningValue: () => null };
  const value = parser.getKerningValueByGlyphs(11, 22);
  assert.equal(value, 0);
  assert.ok(Number.isFinite(value));
});
