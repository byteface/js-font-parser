import test from 'node:test';
import assert from 'node:assert/strict';

import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { matchesDiagnosticFilter } from '../dist/types/Diagnostics.js';
import { KernTable } from '../dist/table/KernTable.js';
import { KernSubtableFormat0 } from '../dist/table/KernSubtableFormat0.js';

function makeMinimalWoff({
  numTables = 1,
  length = 96,
  totalSfntSize = 128,
  entryOffset = 80,
  compLength = 8,
  origLength = 8
} = {}) {
  const size = Math.max(length, entryOffset + compLength);
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false);
  view.setUint32(8, length, false);
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

test('woff/kern diagnostics: diagnostic filter with global regex should be stable across repeated calls', () => {
  const filter = { code: /MISSING_/g };
  const diagnostic = { code: 'MISSING_CMAP_FORMAT', level: 'warning', phase: 'parse', message: 'x' };
  assert.equal(matchesDiagnosticFilter(diagnostic, filter), true);
  assert.equal(matchesDiagnosticFilter(diagnostic, filter), true);
});

test('woff/kern diagnostics: diagnostic filter with sticky regex should be stable across repeated calls', () => {
  const filter = { code: /MISSING_/y };
  const diagnostic = { code: 'MISSING_GPOS', level: 'info', phase: 'layout', message: 'x' };
  assert.equal(matchesDiagnosticFilter(diagnostic, filter), true);
  assert.equal(matchesDiagnosticFilter(diagnostic, filter), true);
});

test('woff/kern diagnostics: WOFF sync decode should reject when declared length is smaller than actual buffer size', () => {
  const woff = makeMinimalWoff({ length: 80, entryOffset: 80, compLength: 8, origLength: 8 });
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(woff), /length|invalid|header/i);
});

test('woff/kern diagnostics: WOFF async decode should reject when declared length is smaller than actual buffer size', async () => {
  const woff = makeMinimalWoff({ length: 80, entryOffset: 80, compLength: 8, origLength: 8 });
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(woff.buffer), /length|invalid|header/i);
});

test('woff/kern diagnostics: WOFF async decode should reject when compLength > origLength for a table', async () => {
  const woff = makeMinimalWoff({ compLength: 12, origLength: 8 });
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(woff.buffer), /origLength|invalid|table/i);
});

test('woff/kern diagnostics: WOFF sync decode rejects numTables=0 malformed header', () => {
  const woff = makeMinimalWoff({ numTables: 0, length: 64, entryOffset: 44, compLength: 0, origLength: 0 });
  assert.throws(() => FontParserWOFF.decodeWoffToSfntSync(woff), /numTables/i);
});

test('woff/kern diagnostics: WOFF async decode rejects numTables=0 malformed header', async () => {
  const woff = makeMinimalWoff({ numTables: 0, length: 64, entryOffset: 44, compLength: 0, origLength: 0 });
  await assert.rejects(() => FontParserWOFF.decodeWoffToSfnt(woff.buffer), /numTables/i);
});

test('woff/kern diagnostics: KernTable should continue to later format0 subtable when earlier one returns 0', () => {
  const kt = Object.create(KernTable.prototype);
  const s1 = Object.create(KernSubtableFormat0.prototype);
  const s2 = Object.create(KernSubtableFormat0.prototype);
  s1.getKerningValue = () => 0;
  s2.getKerningValue = () => -75;
  kt.tables = [s1, s2];
  kt.nTables = 2;
  assert.equal(kt.getKerningValue(10, 11), -75);
});

test('woff/kern diagnostics: KernTable returns 0 when all format0 subtables return 0', () => {
  const kt = Object.create(KernTable.prototype);
  const s1 = Object.create(KernSubtableFormat0.prototype);
  const s2 = Object.create(KernSubtableFormat0.prototype);
  s1.getKerningValue = () => 0;
  s2.getKerningValue = () => 0;
  kt.tables = [s1, s2];
  kt.nTables = 2;
  assert.equal(kt.getKerningValue(1, 2), 0);
});

test('woff/kern diagnostics: KernTable ignores non-format0 subtables and still resolves later format0 values', () => {
  const kt = Object.create(KernTable.prototype);
  const non0 = { getKerningValue: () => -30 };
  const s2 = Object.create(KernSubtableFormat0.prototype);
  s2.getKerningValue = () => -20;
  kt.tables = [non0, s2];
  kt.nTables = 2;
  assert.equal(kt.getKerningValue(3, 4), -20);
});
