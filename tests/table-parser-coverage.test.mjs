import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { FontParser } from '../dist/data/FontParser.js';
import { ByteArray } from '../dist/utils/ByteArray.js';
import { Table } from '../dist/table/Table.js';
import { TableFactory } from '../dist/table/TableFactory.js';

function loadFont(relativePath) {
  const data = fs.readFileSync(relativePath);
  return FontParser.fromArrayBuffer(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

function de(tag, length) {
  return { tag, offset: 0, length };
}

function u16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function i16(value) {
  return u16(value & 0xffff);
}

function u32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function fixed16_16(intPart, frac = 0) {
  return u32((intPart << 16) | frac);
}

function ascii(text, length) {
  const bytes = Array.from(text.slice(0, length)).map((ch) => ch.charCodeAt(0));
  while (bytes.length < length) bytes.push(0);
  return bytes;
}

test('table parser coverage: real fonts expose structured BASE, DSIG, gasp, vhea, and vmtx tables', () => {
  const inter = loadFont('truetypefonts/curated/Inter-VF.ttf');
  const gasp = inter.getTableByType(Table.gasp);
  assert.ok(gasp);
  assert.ok(Array.isArray(gasp.ranges));
  assert.ok(gasp.ranges.length > 0);

  const serif = loadFont('truetypefonts/curated/SourceSerif4-Regular.otf');
  const base = serif.getTableByType(Table.BASE);
  const dsig = serif.getTableByType(Table.DSIG);
  assert.ok(base);
  assert.equal(typeof base.version, 'number');
  assert.ok(dsig);
  assert.equal(typeof dsig.numSignatures, 'number');

  const emoji = loadFont('truetypefonts/curated/NotoColorEmoji.ttf');
  const vhea = emoji.getTableByType(Table.vhea);
  const vmtx = emoji.getTableByType(Table.vmtx);
  const vertical = emoji.getVerticalMetrics();
  assert.ok(vhea);
  assert.ok(vmtx);
  assert.ok(vertical);
  assert.ok(vhea.numberOfVMetrics > 0);
  assert.ok(vmtx.getAdvanceHeight(0) > 0);
  assert.equal(vertical.hasVerticalMetricsTable, true);
});

test('table parser coverage: factory creates JSTF parser from synthetic bytes', () => {
  const bytes = new Uint8Array([
    ...fixed16_16(1),
    ...u16(1),
    0x6c, 0x61, 0x74, 0x6e,
    ...u16(12)
  ]);
  const table = new TableFactory().create(de(Table.JSTF, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.JSTF);
  assert.equal(table.scriptCount, 1);
  assert.equal(table.scriptRecords[0].tag, 'latn');
});

test('table parser coverage: factory creates LTSH parser from synthetic bytes', () => {
  const bytes = new Uint8Array([
    ...u16(0),
    ...u16(3),
    8, 12, 16
  ]);
  const table = new TableFactory().create(de(Table.LTSH, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.LTSH);
  assert.deepEqual(table.yPels, [8, 12, 16]);
});

test('table parser coverage: factory creates PCLT parser from synthetic bytes', () => {
  const bytes = new Uint8Array([
    ...fixed16_16(1),
    ...u32(1234),
    ...u16(500),
    ...u16(400),
    ...u16(2),
    ...u16(3),
    ...u16(700),
    ...u16(42),
    ...ascii('Test Face', 16),
    ...ascii('ASCIISET', 8),
    ...ascii('TEST', 6),
    5,
    6,
    7,
    0
  ]);
  const table = new TableFactory().create(de(Table.PCLT, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.PCLT);
  assert.equal(table.typeface, 'Test Face');
  assert.equal(table.pitch, 500);
});

test('table parser coverage: factory creates VDMX parser from synthetic bytes', () => {
  const bytes = new Uint8Array([
    ...u16(0),
    ...u16(1),
    ...u16(1),
    1, 1, 1, 255,
    ...u16(12),
    ...u16(1),
    8,
    16,
    ...u16(12),
    ...i16(20),
    ...i16(-4)
  ]);
  const table = new TableFactory().create(de(Table.VDMX, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.VDMX);
  assert.equal(table.groups.length, 1);
  assert.equal(table.groups[0].entries[0].yPelHeight, 12);
});

test('table parser coverage: factory creates hdmx parser from synthetic bytes', () => {
  const bytes = new Uint8Array([
    ...u16(0),
    ...i16(1),
    ...u32(5),
    12,
    18,
    4, 5, 6
  ]);
  const table = new TableFactory().create(de(Table.hdmx, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.hdmx);
  assert.equal(table.records[0].pixelSize, 12);
  assert.deepEqual(table.records[0].widths, [4, 5, 6]);
});

test('table parser coverage: factory creates vhea and vmtx parsers from synthetic bytes', () => {
  const vheaBytes = new Uint8Array([
    ...u32(0x00010000),
    ...i16(800),
    ...i16(-200),
    ...i16(0),
    ...u16(1000),
    ...i16(12),
    ...i16(-14),
    ...i16(900),
    ...i16(1),
    ...i16(0),
    ...i16(0),
    ...i16(0),
    ...i16(0),
    ...i16(0),
    ...i16(0),
    ...i16(0),
    ...u16(2)
  ]);
  const vhea = new TableFactory().create(de(Table.vhea, vheaBytes.length), new ByteArray(vheaBytes));
  assert.equal(vhea.getType(), Table.vhea);
  assert.equal(vhea.numberOfVMetrics, 2);

  const vmtxBytes = new Uint8Array([
    ...u16(1000), ...i16(10),
    ...u16(900), ...i16(20),
    ...i16(30)
  ]);
  const vmtx = new TableFactory().create(de(Table.vmtx, vmtxBytes.length), new ByteArray(vmtxBytes));
  vmtx.run(2, 1);
  assert.equal(vmtx.getAdvanceHeight(0), 1000);
  assert.equal(vmtx.getAdvanceHeight(2), 900);
  assert.equal(vmtx.getTopSideBearing(2), 30);
});
