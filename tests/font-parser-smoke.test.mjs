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

test('font parser smoke: Inter variable exposes axes and basic glyph mapping', () => {
  const font = loadFont('truetypefonts/curated/Inter-VF.ttf');
  const axes = font.getVariationAxes();
  assert.ok(Array.isArray(axes) && axes.length > 0, 'expected variation axes for Inter');
  assert.ok(font.getGlyphIndexByChar('A') > 0, 'expected Latin glyph mapping in Inter');
});

test('font parser smoke: IBM Plex Serif exposes core glyph geometry', () => {
  const font = loadFont('truetypefonts/curated/IBMPlexSerif-Regular.ttf');
  const glyph = font.getGlyphByChar('Q');
  assert.ok(glyph, 'expected IBM Plex Serif glyph data');
  assert.ok(glyph.getPointCount() > 0, 'expected IBM Plex Serif contour points');
});

test('font parser smoke: Noto Sans Georgian variable maps Georgian text', () => {
  const font = loadFont('truetypefonts/curated/NotoSansGeorgian-VF.ttf');
  const layout = font.layoutStringAuto('ქართული', { gpos: true });
  assert.ok(layout.length > 0, 'expected Georgian layout entries');
});

test('font parser smoke: extra emoji fixtures load and map emoji coverage', () => {
  const notoEmoji = loadFont('truetypefonts/curated/NotoColorEmoji.ttf');
  const appleEmoji = loadFont('truetypefonts/curated/AppleColorEmoji-sbix-subset.ttf');
  const twitterEmoji = loadFont('truetypefonts/svg/TwitterColorEmoji-SVGinOT-15.1.0/TwitterColorEmoji-SVGinOT.ttf');
  assert.ok(notoEmoji.getGlyphIndexByChar('😀') > 0, 'expected Noto Color Emoji cmap mapping');
  assert.equal(notoEmoji.layoutStringAuto('😀😀', { gpos: true }).length, 2, 'expected Noto Color Emoji layout entries');
  assert.ok(notoEmoji.getGlyphByChar('😀'), 'expected Noto Color Emoji glyph object');
  assert.equal(notoEmoji.getGlyphByChar('😀')?.advanceWidth ?? 0, 2550, 'expected metrics-only emoji glyph fallback to preserve advance width');
  assert.ok(notoEmoji.getTableByType(Table.CBDT), 'expected Noto Color Emoji CBDT table');
  assert.ok(notoEmoji.getTableByType(Table.CBLC), 'expected Noto Color Emoji CBLC table');
  assert.deepEqual(notoEmoji.getBitmapColorInfo().format, 'cbdt-cblc');
  const bitmap = notoEmoji.getBitmapStrikeForChar('😀');
  assert.ok(bitmap, 'expected bitmap strike extraction for Noto Color Emoji');
  assert.equal(bitmap?.mimeType, 'image/png');
  assert.equal(bitmap?.ppemY, 109);
  assert.equal(bitmap?.imageFormat, 17);
  assert.ok((bitmap?.data.length ?? 0) > 1000, 'expected embedded PNG payload');

  assert.ok(appleEmoji.getGlyphIndexByChar('😀') > 0, 'expected Apple sbix subset cmap mapping');
  assert.deepEqual(appleEmoji.getBitmapColorInfo().format, 'sbix');
  const sbixBitmap = appleEmoji.getBitmapStrikeForChar('😀');
  assert.ok(sbixBitmap, 'expected sbix bitmap strike extraction');
  assert.equal(sbixBitmap?.graphicType, 'png ');
  assert.equal(sbixBitmap?.mimeType, 'image/png');
  assert.equal(sbixBitmap?.ppemY, 20);
  assert.equal(sbixBitmap?.metrics?.width, 20);
  assert.equal(sbixBitmap?.metrics?.height, 20);
  assert.ok((sbixBitmap?.data.length ?? 0) > 1000, 'expected embedded sbix PNG payload');
  assert.ok(twitterEmoji.getGlyphByChar('😀'), 'expected Twitter SVGinOT emoji glyph');
});
