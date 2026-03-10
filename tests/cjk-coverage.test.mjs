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

const CJK_FIXTURES = [
  {
    label: 'Chinese sans',
    path: 'truetypefonts/curated-extra/NotoSansCJKsc-Regular.otf',
    plain: '汉字',
    spacingPlain: '汉字',
    spaced: '汉　字',
    glyphs: ['汉', '字']
  },
  {
    label: 'Chinese serif',
    path: 'truetypefonts/curated-extra/NotoSerifCJKsc-Regular.otf',
    plain: '汉字',
    spacingPlain: '汉字',
    spaced: '汉　字',
    glyphs: ['汉', '字']
  },
  {
    label: 'Japanese sans',
    path: 'truetypefonts/curated/NotoSansCJKjp-Regular.otf',
    plain: 'かな漢字',
    spacingPlain: 'かな',
    spaced: 'か　な',
    glyphs: ['か', 'な', '漢']
  },
  {
    label: 'Japanese serif',
    path: 'truetypefonts/curated-extra/NotoSerifCJKjp-Regular.otf',
    plain: 'かな漢字',
    spacingPlain: 'かな',
    spaced: 'か　な',
    glyphs: ['か', 'な', '漢']
  },
  {
    label: 'Korean sans',
    path: 'truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf',
    plain: '한글',
    spacingPlain: '한글',
    spaced: '한　글',
    glyphs: ['한', '글']
  },
  {
    label: 'Korean serif',
    path: 'truetypefonts/curated-extra/NotoSerifCJKkr-Regular.otf',
    plain: '한글',
    spacingPlain: '한글',
    spaced: '한　글',
    glyphs: ['한', '글']
  }
];

test('cjk coverage: fixtures parse with large glyph sets and representative glyph outlines', () => {
  for (const fixture of CJK_FIXTURES) {
    const font = loadFont(fixture.path);
    assert.ok(font.getNumGlyphs() > 10000, `expected large glyph count for ${fixture.label}`);

    for (const ch of fixture.glyphs) {
      const gid = font.getGlyphIndexByChar(ch);
      assert.ok(Number.isInteger(gid) && gid >= 0, `expected glyph index for ${ch} in ${fixture.label}`);
      const glyph = font.getGlyphByChar(ch);
      assert.ok(glyph, `expected glyph object for ${ch} in ${fixture.label}`);
      assert.ok(glyph.getPointCount() > 0, `expected outline points for ${ch} in ${fixture.label}`);
    }
  }
});

test('cjk coverage: ideographic space widens text in all new CJK fixtures', () => {
  for (const fixture of CJK_FIXTURES) {
    const font = loadFont(fixture.path);
    const plainWidth = width(font, fixture.spacingPlain);
    const spacedWidth = width(font, fixture.spaced);
    assert.ok(spacedWidth > plainWidth, `expected ideographic space to widen ${fixture.label}`);
  }
});

test('cjk coverage: canvas and svg stay aligned with measured layout for representative CJK strings', () => {
  for (const fixture of CJK_FIXTURES) {
    const font = loadFont(fixture.path);
    assert.deepEqual(
      captureCanvasXs(font, fixture.plain),
      expectedLayoutXs(font, fixture.plain),
      `expected canvas positions to match layout for ${fixture.label}`
    );
    assertNear(
      svgWidth(font, fixture.plain, { scale: 0.05 }),
      width(font, fixture.plain) * 0.05,
      1e-9
    );
  }
});
