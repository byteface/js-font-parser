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

function makeWoffWithBadDataOffset({
  numTables = 1,
  length = 96,
  totalSfntSize = 128,
  entryOffset = 44, // points into table directory/header area
  compLength = 8,
  origLength = 8
} = {}) {
  const size = Math.max(length, 96);
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false);
  view.setUint32(8, size, false);
  view.setUint16(12, numTables, false);
  view.setUint16(14, 0, false);
  view.setUint32(16, totalSfntSize, false);
  if (numTables > 0) {
    view.setUint32(44, 0x68656164, false); // head
    view.setUint32(48, entryOffset, false);
    view.setUint32(52, compLength, false);
    view.setUint32(56, origLength, false);
    view.setUint32(60, 0, false);
    for (let i = entryOffset; i < entryOffset + compLength && i < bytes.length; i++) bytes[i] = 0xaa;
  }
  return new Uint8Array(buffer);
}

test('high-impact: TTF kerning API should not return NaN for malformed kern subtables', () => {
  const parser = createTtfParserMock();
  parser.kern = { getKerningValue: () => Number.NaN };
  const value = parser.getKerningValueByGlyphs(10, 20);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('high-impact: WOFF kerning API should not return NaN for malformed kern subtables', () => {
  const parser = createWoffParserMock();
  parser.kern = { getKerningValue: () => Number.NaN };
  const value = parser.getKerningValueByGlyphs(10, 20);
  assert.equal(Number.isFinite(value), true);
  assert.equal(value, 0);
});

test('high-impact: LayoutEngine should keep finite geometry if glyph advance is NaN', () => {
  const diagnostics = [];
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: Number.NaN }; },
    getGlyphByChar() { return { advanceWidth: Number.NaN }; },
    getKerningValueByGlyphs() { return 0; }
  };

  const layout = LayoutEngine.layoutText(font, 'AB', { diagnostics });
  assert.ok(Number.isFinite(layout.width));
  assert.ok(layout.lines.every((line) => Number.isFinite(line.width)));
});

test('high-impact: LayoutEngine should ignore non-finite kerning values', () => {
  const font = {
    getTableByType() { return null; },
    getGlyphIndexByChar() { return 1; },
    getGlyph() { return { advanceWidth: 500 }; },
    getGlyphByChar() { return { advanceWidth: 500 }; },
    getKerningValueByGlyphs() { return Number.NaN; }
  };

  const layout = LayoutEngine.layoutText(font, 'AB', { useKerning: true });
  const width = layout.lines[0].glyphs.reduce((sum, g) => sum + g.advance, 0);
  assert.equal(Number.isFinite(width), true);
  assert.equal(width, 1000);
});

test('high-impact: WOFF sync decode should reject table data offsets that point into the header/directory region', () => {
  const woff = makeWoffWithBadDataOffset({ entryOffset: 44, compLength: 8, origLength: 8 });
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(woff), /offset|directory|header|invalid/i);
});

test('high-impact: WOFF async decode should reject table data offsets that point into the header/directory region', async () => {
  const woff = makeWoffWithBadDataOffset({ entryOffset: 44, compLength: 8, origLength: 8 });
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(woff.buffer), /offset|directory|header|invalid/i);
});
