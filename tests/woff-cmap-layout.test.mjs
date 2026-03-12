import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParser } from '../dist/data/FontParser.js';
import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { matchesDiagnosticFilter } from '../dist/types/Diagnostics.js';

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

function makeMinimalWoffTwoTableBuffer(entryA, entryB, { length = 192, totalSfntSize = 220 } = {}) {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false);
  view.setUint32(8, length, false);
  view.setUint16(12, 2, false);
  view.setUint16(14, 0, false);
  view.setUint32(16, totalSfntSize, false);

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

test('woff/cmap: TTF emits multi-char diagnostic for two BMP characters', () => {
  const parser = createTtfParserMock();
  parser.cmap = { formats: [], getCmapFormats: () => [] };

  parser.getGlyphIndexByChar('ab');
  const warnings = parser.getDiagnostics({ code: 'MULTI_CHAR_INPUT' });
  assert.equal(warnings.length, 1);
});

test('woff/cmap: WOFF emits multi-char diagnostic for two BMP characters', () => {
  const parser = createWoffParserMock();
  parser.cmap = { formats: [], getCmapFormats: () => [] };

  parser.getGlyphIndexByChar('ab');
  const warnings = parser.getDiagnostics({ code: 'MULTI_CHAR_INPUT' });
  assert.equal(warnings.length, 1);
});

test('woff/cmap: TTF falls back to a secondary cmap format when the preferred one misses', () => {
  const parser = createTtfParserMock();
  const missingFormat4 = { getFormatType: () => 4, mapCharCode: () => 0 };
  const workingFormat4 = { getFormatType: () => 4, mapCharCode: () => 321 };
  parser.cmap = {
    formats: [missingFormat4, workingFormat4],
    getCmapFormats(platformId, encodingId) {
      if (platformId === 3 && encodingId === 1) return [missingFormat4, workingFormat4];
      return [];
    }
  };

  assert.equal(parser.getGlyphIndexByChar('A'), 321);
});

test('woff/cmap: WOFF falls back to a secondary cmap format when the preferred one misses', () => {
  const parser = createWoffParserMock();
  const missingFormat4 = { getFormatType: () => 4, mapCharCode: () => 0 };
  const workingFormat4 = { getFormatType: () => 4, mapCharCode: () => 654 };
  parser.cmap = {
    formats: [missingFormat4, workingFormat4],
    getCmapFormats(platformId, encodingId) {
      if (platformId === 3 && encodingId === 1) return [missingFormat4, workingFormat4];
      return [];
    }
  };

  assert.equal(parser.getGlyphIndexByChar('A'), 654);
});

test('woff/cmap: LayoutEngine applies deterministic fallback kerning when glyph indices are unavailable', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getGlyph() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return -200; }
  };

  const layout = LayoutEngine.layoutText(font, 'AB', { useKerning: true });
  assert.equal(layout.lines[0].glyphs.length, 2);
  const width = layout.lines[0].glyphs[0].advance + layout.lines[0].glyphs[1].advance;
  assert.equal(width, 800);
});

test('woff/cmap: LayoutEngine useKerning:false keeps fixed advances with missing glyph indices', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphByChar() { return { advanceWidth: 400 }; },
    getGlyph() { return { advanceWidth: 400 }; },
    getKerningValueByGlyphs() { return -200; }
  };

  const layout = LayoutEngine.layoutText(font, 'AB', { useKerning: false });
  const width = layout.lines[0].glyphs[0].advance + layout.lines[0].glyphs[1].advance;
  assert.equal(width, 800);
});

test('woff/cmap: WOFF sync decode still rejects overlapping table byte ranges', () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 100, compLength: 30, origLength: 30 },
    { tag: 0x68686561, offset: 120, compLength: 30, origLength: 30 }
  );
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(bytes), /overlapping|invalid|offset|table/i);
});

test('woff/cmap: WOFF sync decode accepts strictly non-overlapping table ranges', () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 100, compLength: 20, origLength: 20 },
    { tag: 0x68686561, offset: 120, compLength: 24, origLength: 24 }
  );
  const sfnt = FontParserWOFF.decodeWoffToSfntSync(bytes);
  assert.ok(sfnt instanceof Uint8Array);
});

test('woff/cmap: WOFF sync decode rejects table data offsets inside the header region', () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 44, compLength: 8, origLength: 8 },
    { tag: 0x68686561, offset: 100, compLength: 20, origLength: 20 },
    { length: 160, totalSfntSize: 192 }
  );
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(bytes), /offset|directory|header|invalid/i);
});

test('woff/cmap: WOFF async decode rejects table data offsets inside the header region', async () => {
  const bytes = makeMinimalWoffTwoTableBuffer(
    { tag: 0x68656164, offset: 44, compLength: 8, origLength: 8 },
    { tag: 0x68686561, offset: 100, compLength: 20, origLength: 20 },
    { length: 160, totalSfntSize: 192 }
  );
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(bytes.buffer), /offset|directory|header|invalid/i);
});

test('woff/cmap: diagnostics filter regex and phase matching stays strict', () => {
  const d = { code: 'MISSING_CMAP_FORMAT', level: 'warning', phase: 'parse', message: 'x' };
  assert.equal(matchesDiagnosticFilter(d, { code: /^MISSING_/ }), true);
  assert.equal(matchesDiagnosticFilter(d, { code: /^UNSUPPORTED_/ }), false);
  assert.equal(matchesDiagnosticFilter(d, { phase: 'layout' }), false);
});

test('woff/cmap: FontParser.fromArrayBuffer rejects invalid tiny buffers', () => {
  assert.throws(() => FontParser.fromArrayBuffer(new Uint8Array([1, 2, 3]).buffer), /Invalid font buffer/);
});
