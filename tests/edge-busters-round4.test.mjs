import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { PairPosFormat1 } from '../dist/table/PairPosFormat1.js';

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

function makeMinimalWoff({ totalSfntSize = 128, length = 96 } = {}) {
  const size = Math.max(length, 96);
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false);
  view.setUint32(8, size, false);
  view.setUint16(12, 1, false);
  view.setUint16(14, 0, false);
  view.setUint32(16, totalSfntSize, false);
  // one table record
  view.setUint32(44, 0x68656164, false); // head
  view.setUint32(48, 80, false);
  view.setUint32(52, 8, false);
  view.setUint32(56, 8, false);
  view.setUint32(60, 0, false);
  for (let i = 80; i < 88 && i < bytes.length; i++) bytes[i] = 0xaa;
  return new Uint8Array(buffer);
}

function createPairLookupWithKerningValue(value) {
  const pair = Object.create(PairPosFormat1.prototype);
  pair.getKerning = () => value;
  const lookup = {
    getType: () => 2,
    getSubtableCount: () => 1,
    getSubtable: () => pair
  };
  return { lookupList: { getLookups: () => [lookup] } };
}

function createLayoutFont() {
  return {
    getTableByType() { return null; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return 0; }
  };
}

test('round4 edge: TTF GPOS kerning should stay finite when a pair subtable returns NaN', () => {
  const parser = createTtfParserMock();
  parser.gpos = createPairLookupWithKerningValue(Number.NaN);
  const value = parser.getGposKerningValueByGlyphs(10, 11);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('round4 edge: WOFF GPOS kerning should stay finite when a pair subtable returns NaN', () => {
  const parser = createWoffParserMock();
  parser.gpos = createPairLookupWithKerningValue(Number.NaN);
  const value = parser.getGposKerningValueByGlyphs(10, 11);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('round4 edge: TTF getKerningValue remains finite when GPOS kerning path returns NaN', () => {
  const parser = createTtfParserMock();
  parser.kern = null;
  parser.gpos = createPairLookupWithKerningValue(Number.NaN);
  parser.getGlyphIndexByChar = () => 7;
  const value = parser.getKerningValue('A', 'V');
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('round4 edge: WOFF getKerningValue remains finite when GPOS kerning path returns NaN', () => {
  const parser = createWoffParserMock();
  parser.kern = null;
  parser.gpos = createPairLookupWithKerningValue(Number.NaN);
  parser.getGlyphIndexByChar = () => 7;
  const value = parser.getKerningValue('A', 'V');
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('round4 edge: LayoutEngine should keep finite widths when letterSpacing is NaN', () => {
  const layout = LayoutEngine.layoutText(createLayoutFont(), 'TEST', { letterSpacing: Number.NaN });
  assert.ok(Number.isFinite(layout.width));
  assert.ok(layout.lines.every((line) => Number.isFinite(line.width)));
});

test('round4 edge: LayoutEngine should keep finite result when lineHeight is NaN', () => {
  const layout = LayoutEngine.layoutText(createLayoutFont(), 'A\nB', { lineHeight: Number.NaN });
  assert.ok(Number.isFinite(layout.lineHeight));
  assert.ok(Number.isFinite(layout.height));
});

test('round4 edge: LayoutEngine should keep finite result when maxWidth is NaN', () => {
  const layout = LayoutEngine.layoutText(createLayoutFont(), 'ABCD', { maxWidth: Number.NaN });
  assert.ok(Number.isFinite(layout.width));
  assert.ok(Number.isFinite(layout.height));
});

test('round4 edge: WOFF sync decode rejects too-small totalSfntSize', () => {
  const woff = makeMinimalWoff({ totalSfntSize: 12 }); // smaller than sfnt directory
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(woff), /totalSfntSize|too small|invalid/i);
});

test('round4 edge: WOFF async decode rejects too-small totalSfntSize', async () => {
  const woff = makeMinimalWoff({ totalSfntSize: 12 });
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(woff.buffer), /totalSfntSize|too small|invalid/i);
});

test('round4 edge: WOFF sync decode accepts minimal valid totalSfntSize boundary', () => {
  // 12 + numTables*16 + tableData(8) = 36 for one table.
  const woff = makeMinimalWoff({ totalSfntSize: 36 });
  const out = FontParserWOFF.decodeWoffToSfntSync(woff);
  assert.ok(out instanceof Uint8Array);
});
