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

test('parses a font and maps basic glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');

  const glyphIndex = font.getGlyphIndexByChar('H');
  assert.ok(glyphIndex && glyphIndex > 0, 'expected glyph index for H');

  const glyph = font.getGlyphByChar('H');
  assert.ok(glyph, 'expected glyph data for H');
  assert.ok(glyph.getPointCount() > 0, 'expected glyph to have points');
});

test('exposes name records and core tables', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');

  const family = font.getNameRecord(1);
  assert.ok(family && family.length > 0, 'expected family name record');

  const cmap = font.getTableByType(Table.cmap);
  assert.ok(cmap, 'expected cmap table');
});

test('exposes expanded metadata convenience API', () => {
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

test('exports SVG for a string', () => {
  const font = loadFont('truetypefonts/DiscoMo.ttf');
  const svg = SVGFont.exportStringSvg(font, 'Hello', { scale: 0.08 });
  assert.ok(svg.includes('<svg'), 'expected svg output');
  assert.ok(svg.includes('<path'), 'expected svg path output');
});

test('gsub ligature mapping does not expand glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = font.getGlyphIndicesForString('office');
  const shaped = font.getGlyphIndicesForStringWithGsub('office', ['liga']);
  assert.ok(shaped.length <= plain.length, 'expected GSUB shaping to not expand glyph count');
});

test('kerning API returns a number', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const value = font.getKerningValue('A', 'V');
  assert.ok(typeof value === 'number', 'expected kerning value to be a number');
});

test('layout returns positioned glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const layout = font.layoutString('AVATAR', { gsubFeatures: ['liga'] });
  assert.ok(layout.length > 0, 'expected layout entries');
  assert.ok(typeof layout[0].xAdvance === 'number', 'expected xAdvance');
});
