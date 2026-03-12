import test from 'node:test';
import assert from 'node:assert/strict';

import { BaseFontParser } from '../dist/data/BaseFontParser.js';
import { ByteArray } from '../dist/utils/ByteArray.js';
import { Table } from '../dist/table/Table.js';
import { TableFactory } from '../dist/table/TableFactory.js';

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

function f2dot14(value) {
  return i16(Math.round(value * 16384));
}

test('variation table coverage: factory creates avar parser and maps normalized values', () => {
  const bytes = new Uint8Array([
    ...u16(1),
    ...u16(0),
    ...u16(0),
    ...u16(1),
    ...u16(3),
    ...f2dot14(-1),
    ...f2dot14(-1),
    ...f2dot14(0),
    ...f2dot14(0.25),
    ...f2dot14(1),
    ...f2dot14(1)
  ]);
  const table = new TableFactory().create(de(Table.avar, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.avar);
  assert.equal(table.axisCount, 1);
  assert.equal(table.mapCoord(0, -1), -1);
  assert.equal(table.mapCoord(0, 1), 1);
  assert.ok(Math.abs(table.mapCoord(0, 0.5) - 0.625) < 1e-6);
});

test('variation table coverage: factory creates HVAR, VVAR, and MVAR parsers from synthetic bytes', () => {
  const hvarBytes = new Uint8Array([
    ...u16(1),
    ...u16(0),
    ...u32(32),
    ...u32(48),
    ...u32(64),
    ...u32(80)
  ]);
  const hvar = new TableFactory().create(de(Table.HVAR, hvarBytes.length), new ByteArray(hvarBytes));
  assert.equal(hvar.getType(), Table.HVAR);
  assert.equal(hvar.advanceWidthMappingOffset, 48);

  const vvarBytes = new Uint8Array([
    ...u16(1),
    ...u16(0),
    ...u32(28),
    ...u32(44),
    ...u32(60),
    ...u32(76),
    ...u32(92)
  ]);
  const vvar = new TableFactory().create(de(Table.VVAR, vvarBytes.length), new ByteArray(vvarBytes));
  assert.equal(vvar.getType(), Table.VVAR);
  assert.equal(vvar.verticalOriginMappingOffset, 92);

  const mvarBytes = new Uint8Array([
    ...u16(1),
    ...u16(0),
    ...u16(0),
    ...u16(8),
    ...u16(2),
    ...u16(24),
    0x68, 0x61, 0x73, 0x63,
    ...u16(1),
    ...u16(2),
    0x68, 0x64, 0x65, 0x73,
    ...u16(3),
    ...u16(4)
  ]);
  const mvar = new TableFactory().create(de(Table.MVAR, mvarBytes.length), new ByteArray(mvarBytes));
  assert.equal(mvar.getType(), Table.MVAR);
  assert.deepEqual(mvar.records, [
    { tag: 'hasc', deltaSetOuterIndex: 1, deltaSetInnerIndex: 2 },
    { tag: 'hdes', deltaSetOuterIndex: 3, deltaSetInnerIndex: 4 }
  ]);
});

test('variation table coverage: factory creates STAT parser for design axes and axis values', () => {
  const bytes = new Uint8Array([
    ...u16(1),
    ...u16(2),
    ...u16(8),
    ...u16(1),
    ...u32(20),
    ...u16(1),
    ...u32(28),
    ...u16(300),
    0x77, 0x67, 0x68, 0x74,
    ...u16(256),
    ...u16(0),
    ...u16(30),
    ...u16(1),
    ...u16(0),
    ...u16(0),
    ...u16(257),
    ...fixed16_16(700)
  ]);
  const table = new TableFactory().create(de(Table.STAT, bytes.length), new ByteArray(bytes));
  assert.equal(table.getType(), Table.STAT);
  assert.deepEqual(table.designAxes, [{ tag: 'wght', nameId: 256, ordering: 0 }]);
  assert.deepEqual(table.axisValues, [{
    format: 1,
    axisIndex: 0,
    flags: 0,
    valueNameId: 257,
    value: 700
  }]);
  assert.equal(table.elidedFallbackNameId, 300);
});

test('variation table coverage: avar mapping is applied when setting variation coordinates by axis', () => {
  const captured = [];
  const fakeParser = {
    fvar: {
      axes: [
        { name: 'wght', minValue: 0, defaultValue: 50, maxValue: 100 }
      ]
    },
    avar: {
      mapCoord(axisIndex, normalized) {
        assert.equal(axisIndex, 0);
        return normalized + 0.125;
      }
    },
    getFvarTableForShared() {
      return this.fvar;
    },
    getAvarTableForShared() {
      return this.avar;
    },
    setVariationCoords(coords) {
      captured.push(coords);
    }
  };
  BaseFontParser.prototype.setVariationByAxes.call(fakeParser, { wght: 75 });
  assert.deepEqual(captured, [[0.625]]);
});

test('variation table coverage: getVariationInfo reports the expanded variable-font surface', () => {
  const fakeParser = {
    avar: {},
    gvar: {},
    hvar: {},
    vvar: {},
    mvar: {},
    stat: {
      designAxes: [{ tag: 'wght', nameId: 256, ordering: 0 }],
      axisValues: [{ format: 1, axisIndex: 0, value: 700 }],
      elidedFallbackNameId: 300
    },
    getVariationAxes() {
      return [{ name: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 }];
    },
    getStatTableForShared() {
      return this.stat;
    }
  };
  const info = BaseFontParser.prototype.getVariationInfo.call(fakeParser);
  assert.deepEqual(info, {
    axes: [{ name: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 }],
    hasAvar: true,
    hasGvar: true,
    hasHvar: true,
    hasVvar: true,
    hasMvar: true,
    hasStat: true,
    stat: {
      designAxes: [{ tag: 'wght', nameId: 256, ordering: 0 }],
      axisValues: [{ format: 1, axisIndex: 0, value: 700 }],
      elidedFallbackNameId: 300
    }
  });
});
