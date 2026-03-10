import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadFont,
  width
} from './helpers/font-test-utils.mjs';

test('text spacing: Latin space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const spaced = width(font, 'A V');
  const nbsp = width(font, 'A\u00A0V');
  const zwsp = width(font, 'A\u200BV');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.ok(zwsp < spaced);
});

test('text spacing: Arabic space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  const plain = width(font, 'مم');
  const spaced = width(font, 'م م');
  const nbsp = width(font, 'م\u00A0م');
  const zwsp = width(font, 'م\u200Bم');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text spacing: Bengali space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');
  const plain = width(font, 'কক');
  const spaced = width(font, 'ক ক');
  const nbsp = width(font, 'ক\u00A0ক');
  const zwsp = width(font, 'ক\u200Bক');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text spacing: Urdu space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf');
  const plain = width(font, 'مم');
  const spaced = width(font, 'م م');
  const nbsp = width(font, 'م\u00A0م');
  const zwsp = width(font, 'م\u200Bم');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text spacing: Korean space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf');
  const plain = width(font, '가가');
  const spaced = width(font, '가 가');
  const nbsp = width(font, '가\u00A0가');
  const zwsp = width(font, '가\u200B가');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text spacing: Devanagari space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const plain = width(font, 'कक');
  const spaced = width(font, 'क क');
  const nbsp = width(font, 'क\u00A0क');
  const zwsp = width(font, 'क\u200Bक');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text spacing: space glyph points stay baseline-only while still affecting measured width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const spacePoints = font.getGlyphPointsByChar(' ');
  assert.ok(spacePoints.length >= 0);
  assert.ok(spacePoints.every((point) => point.y === 0), 'space glyph should not introduce vertical contours');
  assert.ok(width(font, 'A A') > width(font, 'AA'));
});

test('text spacing: layoutToPoints keeps spaced advance widths for Latin and Arabic', () => {
  const latin = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const arabic = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');

  const latinPoints = latin.layoutToPoints('A A', { gpos: true });
  const latinPlain = latin.layoutToPoints('AA', { gpos: true });
  assert.ok(latinPoints.advanceWidth > latinPlain.advanceWidth);

  const arabicPoints = arabic.layoutToPoints('م م', { gpos: true });
  const arabicPlain = arabic.layoutToPoints('مم', { gpos: true });
  assert.ok(arabicPoints.advanceWidth > arabicPlain.advanceWidth);
});

test('text controls: word joiner stays non-spacing in plain measurement and layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const joined = width(font, 'A\u2060V');
  assert.equal(joined, plain);

  const layout = font.layoutString('A\u2060V', { gpos: true });
  assert.equal(layout.length, 2);
  assert.deepEqual(layout.map((glyph) => glyph.xAdvance), font.layoutString('AV', { gpos: true }).map((glyph) => glyph.xAdvance));
});

test('text controls: soft hyphen stays invisible in plain measurement and layout until line breaking logic handles it', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const softHyphen = width(font, 'A\u00ADV');
  assert.equal(softHyphen, plain);

  const layout = font.layoutString('A\u00ADV', { gpos: true });
  assert.equal(layout.length, 2);
  assert.deepEqual(layout.map((glyph) => glyph.xAdvance), font.layoutString('AV', { gpos: true }).map((glyph) => glyph.xAdvance));
});

test('text controls: leading ZWSP does not affect Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, '\u200BAV'), width(font, 'AV'));
  assert.equal(font.layoutString('\u200BAV', { gpos: true }).length, 2);
});

test('text controls: interstitial ZWSP does not disturb Latin kerning width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200BV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200BV', { gpos: true }).length, 2);
});

test('text controls: trailing ZWSP does not change Latin width or add positioned glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'AV\u200B'), width(font, 'AV'));
  assert.equal(font.layoutString('AV\u200B', { gpos: true }).length, 2);
});

test('text controls: repeated ZWSP controls stay invisible in Latin runs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200B\u200BV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200B\u200BV', { gpos: true }).length, 2);
});

test('text controls: LRM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200EV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200EV', { gpos: true }).length, 2);
});

test('text controls: RLM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200FV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200FV', { gpos: true }).length, 2);
});

test('text controls: BOM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\uFEFFV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\uFEFFV', { gpos: true }).length, 2);
});

test('text controls: ALM stays invisible in Arabic measurement and layout', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(width(font, 'م\u061Cم'), width(font, 'مم'));
  assert.equal(font.layoutString('م\u061Cم', { gpos: true }).length, 2);
});

test('text controls: layoutToPoints advance ignores trailing ZWSP in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.layoutToPoints('AV\u200B', { gpos: true }).advanceWidth, font.layoutToPoints('AV', { gpos: true }).advanceWidth);
});
