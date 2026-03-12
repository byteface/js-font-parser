import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';
import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { Table } from '../dist/table/Table.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath);
}

const CURATED_FIXTURES = [
  'truetypefonts/curated/AppleColorEmoji-sbix-subset.ttf',
  'truetypefonts/curated/IBMPlexSerif-Regular.ttf',
  'truetypefonts/curated/FiraSans-Regular.ttf',
  'truetypefonts/curated/Inter-VF.ttf',
  'truetypefonts/curated/Roboto-VF.ttf',
  'truetypefonts/curated/NotoSerif-VF.ttf',
  'truetypefonts/curated/NotoSansTamil-VF.ttf',
  'truetypefonts/curated/NotoSansGeorgian-VF.ttf',
  'truetypefonts/curated/SourceSerif4-Regular.otf',
  'truetypefonts/curated/SourceSans3-Regular.otf',
  'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
  'truetypefonts/curated/SourceSerif4Variable-Italic.otf',
  'truetypefonts/curated/NotoSansCJKjp-Regular.otf',
  'truetypefonts/curated/NotoColorEmoji.ttf'
];

test('fixture smoke: curated fixture list stays in sync with curated folder fonts', () => {
  const curatedDir = path.resolve(__dirname, '..', 'truetypefonts', 'curated');
  const actual = fs.readdirSync(curatedDir)
    .filter((name) => /\.(ttf|otf|woff)$/i.test(name))
    .map((name) => `truetypefonts/curated/${name}`)
    .sort();
  assert.deepEqual([...CURATED_FIXTURES].sort(), actual);
});

test('fixture smoke: CFF CID-keyed OTF smoke glyphs keep valid outlines', () => {
  const otfBytes = readBytes('truetypefonts/curated/NotoSansCJKjp-Regular.otf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(otfBytes));
  assert.ok(font instanceof FontParserTTF);

  for (const ch of ['h', 'e', 'o', 'd']) {
    const glyph = font.getGlyphByChar(ch);
    assert.ok(glyph, `expected glyph object for ${ch}`);
    assert.ok(glyph.getPointCount() > 0, `expected outline points for ${ch}`);
  }
});

test('fixture smoke: curated fixture fonts parse and expose stable core metadata', () => {
  for (const fixture of CURATED_FIXTURES) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    assert.ok(font instanceof FontParserTTF, `expected TTF-compatible parser for ${fixture}`);

    const meta = font.getMetadata();
    assert.ok(meta && typeof meta === 'object', `metadata object for ${fixture}`);
    assert.ok(meta.names && typeof meta.names === 'object', `names section for ${fixture}`);
    assert.ok(Array.isArray(meta.nameRecords), `name records array for ${fixture}`);
    assert.equal(typeof meta.style.isItalic, 'boolean', `style.isItalic for ${fixture}`);
    assert.equal(typeof meta.style.isBold, 'boolean', `style.isBold for ${fixture}`);

    const cmap = font.getTableByType(Table.cmap);
    assert.ok(cmap, `cmap should exist for ${fixture}`);
    assert.ok(font.getNumGlyphs() >= 0, `glyph count should be non-negative for ${fixture}`);
  }
});

test('fixture smoke: curated variable fonts expose variation axes and survive axis updates', () => {
  const variableFixtures = [
    'truetypefonts/curated/Inter-VF.ttf',
    'truetypefonts/curated/Roboto-VF.ttf',
    'truetypefonts/curated/NotoSerif-VF.ttf',
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];

  for (const fixture of variableFixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    assert.ok(Array.isArray(axes), `axes should be an array for ${fixture}`);

    if (axes.length > 0) {
      const minValues = Object.fromEntries(axes.map((axis) => [axis.name, axis.minValue]));
      const maxValues = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));
      font.setVariationByAxes(minValues);
      font.setVariationByAxes(maxValues);
    }

    const layout = font.layoutStringAuto('Hello');
    assert.ok(Array.isArray(layout), `layout result should be an array for ${fixture}`);
  }
});

test('fixture smoke: Noto SEA variable fonts keep Latin stems straight at max weight', () => {
  const fixtures = [
    'truetypefonts/curated-extra/NotoSansThai-VF.ttf',
    'truetypefonts/curated-extra/NotoSansKhmer-VF.ttf',
    'truetypefonts/curated-extra/NotoSansLao-VF.ttf'
  ];

  for (const fixture of fixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    const maxValues = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));
    font.setVariationByAxes(maxValues);
    const glyph = font.getGlyphByChar('L');
    assert.ok(glyph, `expected Latin L glyph for ${fixture}`);
    const bottomLeft = glyph.getPoint(0);
    const topLeft = glyph.getPoint(1);
    assert.ok(bottomLeft && topLeft, `expected left stem points for ${fixture}`);
    assert.ok(
      Math.abs(bottomLeft.x - topLeft.x) <= 2,
      `expected left stem to stay vertical for ${fixture}, got ${bottomLeft.x} vs ${topLeft.x}`
    );
  }
});

test('fixture smoke: CFF2 variable OTF fixtures survive axis extremes and update outlines', () => {
  const cff2Fixtures = [
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];

  const getBbox = (glyph) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < glyph.getPointCount(); i++) {
      const point = glyph.getPoint(i);
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    return { minX, minY, maxX, maxY };
  };

  for (const fixture of cff2Fixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    assert.ok(font instanceof FontParserTTF);

    const axes = font.getVariationAxes();
    assert.ok(Array.isArray(axes), `expected axes array for ${fixture}`);
    assert.ok(axes.length > 0, `expected variable axes for ${fixture}`);

    const defaults = Object.fromEntries(axes.map((axis) => [axis.name, axis.defaultValue]));
    const mins = Object.fromEntries(axes.map((axis) => [axis.name, axis.minValue]));
    const maxs = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));
    const outOfRange = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue + (axis.maxValue - axis.minValue + 1)]));

    const gid = font.getGlyphIndexByChar('H');
    assert.ok(gid != null, `expected test glyph id for ${fixture}`);

    font.setVariationByAxes(defaults);
    const defaultGlyph = font.getGlyph(gid);
    assert.ok(defaultGlyph, `expected default glyph for ${fixture}`);
    const defaultBbox = getBbox(defaultGlyph);

    font.setVariationByAxes(mins);
    const minGlyph = font.getGlyph(gid);
    assert.ok(minGlyph, `expected min glyph for ${fixture}`);

    font.setVariationByAxes(maxs);
    const maxGlyph = font.getGlyph(gid);
    assert.ok(maxGlyph, `expected max glyph for ${fixture}`);

    font.setVariationByAxes(outOfRange);
    const clampedGlyph = font.getGlyph(gid);
    assert.ok(clampedGlyph, `expected clamped glyph for ${fixture}`);

    const minBbox = getBbox(minGlyph);
    const maxBbox = getBbox(maxGlyph);
    const clampedBbox = getBbox(clampedGlyph);
    assert.ok(Number.isFinite(minBbox.minX) && Number.isFinite(maxBbox.maxX));
    assert.ok(Number.isFinite(clampedBbox.minX) && Number.isFinite(clampedBbox.maxX));
    assert.ok(
      minBbox.minX !== defaultBbox.minX ||
      minBbox.maxX !== defaultBbox.maxX ||
      maxBbox.minX !== defaultBbox.minX ||
      maxBbox.maxX !== defaultBbox.maxX,
      `expected outline change across axis extremes for ${fixture}`
    );
  }
});
