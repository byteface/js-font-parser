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

function createSpacingFontMock() {
  const advances = new Map([
    ['A', 500],
    ['B', 500],
    [' ', 250],
    ['\u00A0', 250],
    ['\u2009', 120], // thin space
    ['\u2003', 1000], // em space
    ['\u3000', 1000], // ideographic space
    ['\u200B', 0], // ZWSP
    ['\u200C', 0], // ZWNJ
    ['\u200D', 0], // ZWJ
    ['\u2060', 0], // word joiner
    ['\uFE0F', 0], // variation selector-16
    ['\uFEFF', 0], // zero-width no-break space / BOM
    ['\u200E', 0], // LRM
    ['\u200F', 0], // RLM
    ['\u061C', 0], // ALM
    ['\t', 750], // tab via explicit cmap mapping if treated as glyph
    ['\u0301', 0] // combining acute
  ]);

  return {
    getTableByType() { return null; },
    getGlyphIndexByChar(ch) {
      return advances.has(ch) ? ch.codePointAt(0) : null;
    },
    getGlyph(index) {
      if (index == null) return null;
      const ch = String.fromCodePoint(index);
      const advanceWidth = advances.get(ch);
      return typeof advanceWidth === 'number' ? { advanceWidth } : null;
    },
    getGlyphByChar(ch) {
      const advanceWidth = advances.get(ch);
      return typeof advanceWidth === 'number' ? { advanceWidth } : null;
    },
    getKerningValueByGlyphs() { return 0; }
  };
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

test('round6 edge: blank space glyphs still preserve advance width for TTF and WOFF', () => {
  const ttf = createTtfParserMock();
  ttf.maxp = { numGlyphs: 4 };
  ttf.variationCoords = [];
  ttf.hmtx = {
    getAdvanceWidth: () => 300,
    getLeftSideBearing: () => 0
  };
  ttf.glyf = {
    getDescription: () => null
  };
  const ttfSpace = ttf.getGlyph(3);
  assert.ok(ttfSpace, 'expected blank TTF glyph object');
  assert.equal(ttfSpace.advanceWidth, 300);

  const woff = createWoffParserMock();
  woff.maxp = { numGlyphs: 4 };
  woff.variationCoords = [];
  woff.hmtx = {
    getAdvanceWidth: () => 300,
    getLeftSideBearing: () => 0
  };
  woff.glyf = {
    getDescription: () => null
  };
  const woffSpace = woff.getGlyph(3);
  assert.ok(woffSpace, 'expected blank WOFF glyph object');
  assert.equal(woffSpace.advanceWidth, 300);
});

test('round6 edge: collapseSpaces preserves NBSP while collapsing ASCII spaces', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, 'A  B\u00A0\u00A0B', {
    collapseSpaces: true,
    preserveNbsp: true
  });
  assert.equal(out.lines.length, 1);
  const chars = out.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(chars, 'A B\u00A0\u00A0B');
  assert.equal(out.lines[0].width, 500 + 250 + 500 + 250 + 250 + 500);
});

test('round6 edge: collapseSpaces can collapse NBSP when preserveNbsp is false', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, 'A \u00A0 \u00A0B', {
    collapseSpaces: true,
    preserveNbsp: false
  });
  const chars = out.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(chars, 'A B');
  assert.equal(out.lines[0].width, 500 + 250 + 500);
});

test('round6 edge: zero-width format characters keep zero advance when mapped', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, `A\u200B\u200C\u200D\u200E\u200F\u061CB`);
  assert.equal(out.lines[0].glyphs.length, 8);
  assert.equal(out.lines[0].width, 1000);
  const zeroWidthChars = out.lines[0].glyphs.slice(1, -1);
  assert.ok(zeroWidthChars.every((g) => g.advance === 0));
});

test('round6 edge: additional invisible controls stay zero-advance when mapped', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, `A\u2060\uFE0F\uFEFFB`);
  assert.equal(out.lines[0].glyphs.length, 5);
  assert.equal(out.lines[0].width, 1000);
  const zeroWidthChars = out.lines[0].glyphs.slice(1, -1);
  assert.ok(zeroWidthChars.every((g) => g.advance === 0));
});

test('round6 edge: named Unicode spacing characters keep their advances', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, `A\u2009\u2003\u3000B`);
  assert.equal(out.lines[0].width, 500 + 120 + 1000 + 1000 + 500);
});

test('round6 edge: tabs expand to configured spaces instead of becoming missing glyphs', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, 'A\tB', {
    tabSize: 3
  });
  const chars = out.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(chars, 'A   B');
  assert.equal(out.lines[0].width, 500 + 250 + 250 + 250 + 500);
});

test('round6 edge: soft hyphen stays invisible when no line break is required', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, 'A\u00ADB');
  const chars = out.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(chars, 'AB');
  assert.equal(out.lines[0].width, 1000);
});

test('round6 edge: combining marks can remain zero-advance after spaces', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, `A \u0301B`);
  const chars = out.lines[0].glyphs.map((g) => g.char);
  assert.deepEqual(chars, ['A', ' ', '\u0301', 'B']);
  assert.equal(out.lines[0].width, 500 + 250 + 0 + 500);
});

test('round6 edge: trailing spaces can remain in glyph stream while trimmed from line width', () => {
  const font = createSpacingFontMock();
  const out = LayoutEngine.layoutText(font, 'A  ', {
    trimTrailingSpaces: true
  });
  const chars = out.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(chars, 'A  ');
  assert.equal(out.lines[0].width, 500);
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
