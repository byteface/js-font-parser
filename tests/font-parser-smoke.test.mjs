import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ByteArray } from '../dist/utils/ByteArray.js';
import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { Table } from '../dist/table/Table.js';
import { SVGFont } from '../dist/render/SVGFont.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFont(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const data = fs.readFileSync(fullPath);
  return new FontParserTTF(new ByteArray(new Uint8Array(data)));
}

test('font parser smoke: parses a font and maps basic glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const glyphIndex = font.getGlyphIndexByChar('H');
  assert.ok(glyphIndex && glyphIndex > 0, 'expected glyph index for H');

  const glyph = font.getGlyphByChar('H');
  assert.ok(glyph, 'expected glyph data for H');
  assert.ok(glyph.getPointCount() > 0, 'expected glyph to have points');
});

test('font parser smoke: exposes name records and core tables', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const family = font.getNameRecord(1);
  assert.ok(family && family.length > 0, 'expected family name record');

  const cmap = font.getTableByType(Table.cmap);
  assert.ok(cmap, 'expected cmap table');
});

test('font parser smoke: exposes expanded metadata convenience API', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const names = font.getFontNames();
  const os2 = font.getOs2Metrics();
  const post = font.getPostMetrics();
  const meta = font.getMetadata();

  assert.ok(names.family && names.family.length > 0, 'expected convenience family name');
  assert.ok(os2 && typeof os2.weightClass === 'number', 'expected OS/2 convenience metrics');
  assert.ok(post && typeof post.italicAngle === 'number', 'expected post convenience metrics');
  assert.ok(Array.isArray(font.getFsTypeFlags()), 'expected fsType flags');
  assert.ok(Array.isArray(font.getFsSelectionFlags()), 'expected fsSelection flags');
  assert.equal(meta.style.weightClass, font.getWeightClass(), 'expected metadata style weight');
});

test('font parser smoke: exports SVG for a string', () => {
  const font = loadFont('truetypefonts/DiscoMo.ttf');
  const svg = SVGFont.exportStringSvg(font, 'Hello', { scale: 0.08 });
  assert.ok(svg.includes('<svg'), 'expected svg output');
  assert.ok(svg.includes('<path'), 'expected svg path output');
});

test('font parser smoke: gsub ligature mapping does not expand glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = font.getGlyphIndicesForString('office');
  const shaped = font.getGlyphIndicesForStringWithGsub('office', ['liga']);
  assert.ok(shaped.length <= plain.length, 'expected GSUB shaping to not expand glyph count');
});

test('font parser smoke: kerning API returns a finite pair-sensitive number', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const av = font.getKerningValue('A', 'V');
  const aa = font.getKerningValue('A', 'A');
  assert.equal(Number.isFinite(av), true, 'expected finite kerning value for AV');
  assert.equal(Number.isFinite(aa), true, 'expected finite kerning value for AA');
  assert.notEqual(av, aa, 'expected pair-sensitive kerning differences');
});

test('font parser smoke: layout returns positioned glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const layout = font.layoutString('AVATAR', { gsubFeatures: ['liga'] });
  assert.ok(layout.length > 0, 'expected layout entries');
  for (const item of layout) {
    assert.equal(Number.isFinite(item.xAdvance), true, 'expected finite xAdvance');
    assert.equal(Number.isFinite(item.xOffset), true, 'expected finite xOffset');
    assert.equal(Number.isFinite(item.yOffset), true, 'expected finite yOffset');
  }
});
