import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertNear,
  captureCanvasXs,
  expectedLayoutXs,
  loadFont,
  svgWidth,
  width
} from './helpers/font-test-utils.mjs';

const BASE_OPTIONS = {
  gsubFeatures: ['rlig', 'liga', 'calt', 'ccmp', 'mark', 'mkmk'],
  gposFeatures: ['kern', 'mark', 'mkmk', 'curs'],
  scriptTags: ['arab', 'DFLT']
};

const CASES = [
  {
    label: 'Urdu Nastaliq',
    font: 'truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf',
    text: 'اردو زبان',
    spacingPlain: 'اردوزبان',
    spaced: 'اردو زبان',
    zwsp: 'اردو\u200Bزبان',
    glyphs: ['ا', 'ر', 'د', 'و', 'ز', 'ب'],
    markText: 'اللّٰہ'
  },
  {
    label: 'Arabic Sans VF',
    font: 'truetypefonts/curated-extra/NotoSansArabic-VF.ttf',
    text: 'اردو زبان',
    spacingPlain: 'اردوزبان',
    spaced: 'اردو زبان',
    zwsp: 'اردو\u200Bزبان',
    glyphs: ['ا', 'ر', 'د', 'و', 'ز', 'ب'],
    markText: 'اللّٰہ'
  },
  {
    label: 'Arabic Naskh',
    font: 'truetypefonts/noto/NotoNaskhArabic-Regular.ttf',
    text: 'سلام عليكم',
    spacingPlain: 'سلامعليكم',
    spaced: 'سلام عليكم',
    zwsp: 'سلام\u200Bعليكم',
    glyphs: ['س', 'ل', 'ا', 'م', 'ع', 'ي'],
    markText: 'اللّٰه'
  }
];

for (const c of CASES) {
  test(`arabic variants: ${c.label} resolves representative glyphs`, () => {
    const font = loadFont(c.font);
    assert.ok(font.getNumGlyphs() > 0, `expected glyphs in ${c.label}`);

    for (const ch of c.glyphs) {
      const gid = font.getGlyphIndexByChar(ch);
      assert.ok(Number.isInteger(gid) && gid >= 0, `expected glyph index for '${ch}' in ${c.label}`);
      const glyph = font.getGlyphByChar(ch);
      assert.ok(glyph, `expected glyph object for '${ch}' in ${c.label}`);
      assert.ok(Number.isFinite(glyph.advanceWidth), `expected finite advance for '${ch}' in ${c.label}`);
    }
  });

  test(`arabic variants: ${c.label} spacing and zero-width controls stay sane`, () => {
    const font = loadFont(c.font);
    const plainWidth = width(font, c.spacingPlain);
    const spacedWidth = width(font, c.spaced);
    const zwspWidth = width(font, c.zwsp);

    assert.ok(spacedWidth > plainWidth, `expected space to widen ${c.label}`);
    assertNear(zwspWidth, plainWidth, 1e-9);
  });

  test(`arabic variants: ${c.label} mark-heavy sample shows attachment signal`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutString(c.markText, { ...BASE_OPTIONS, gpos: true });
    assert.ok(Array.isArray(layout) && layout.length > 0, `expected shaped layout for ${c.label}`);

    const hasZeroAdvanceMark = layout.some((g) => (g.xAdvance ?? 0) === 0);
    const hasOffset = layout.some((g) => (g.xOffset ?? 0) !== 0 || (g.yOffset ?? 0) !== 0);
    assert.ok(hasZeroAdvanceMark || hasOffset, `expected attached marks in ${c.label}`);
  });

  test(`arabic variants: ${c.label} measured layout stays finite`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutString(c.text, { ...BASE_OPTIONS, gpos: true });
    assert.ok(Array.isArray(layout) && layout.length > 0, `expected layout rows for ${c.label}`);

    for (const row of layout) {
      assert.ok(Number.isFinite(row.glyphIndex), `finite glyph index for ${c.label}`);
      assert.ok(Number.isFinite(row.xAdvance), `finite xAdvance for ${c.label}`);
      assert.ok(Number.isFinite(row.xOffset ?? 0), `finite xOffset for ${c.label}`);
      assert.ok(Number.isFinite(row.yOffset ?? 0), `finite yOffset for ${c.label}`);
    }

    const measured = font.measureText(c.text, { gpos: true }).advanceWidth;
    assert.ok(Number.isFinite(measured), `expected finite measured width for ${c.label}`);
  });

  test(`arabic variants: ${c.label} canvas and svg stay aligned`, () => {
    const font = loadFont(c.font);
    assert.deepEqual(
      captureCanvasXs(font, c.text),
      expectedLayoutXs(font, c.text),
      `expected canvas positions to match layout for ${c.label}`
    );
    assertNear(
      svgWidth(font, c.text, { scale: 0.05 }),
      width(font, c.text) * 0.05,
      1e-9
    );
  });
}
