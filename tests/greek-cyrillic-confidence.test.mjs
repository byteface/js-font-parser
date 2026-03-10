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

const CASES = [
  {
    label: 'Greek Noto Sans',
    font: 'truetypefonts/noto/NotoSans-Regular.ttf',
    text: 'Αθήνα και Ελλάδα',
    spacingPlain: 'ΑΒ',
    spaced: 'Α Β',
    zwsp: 'Α\u200BΒ',
    glyphs: ['Α', 'θ', 'ή', 'λ']
  },
  {
    label: 'Greek Roboto',
    font: 'truetypefonts/curated/Roboto-VF.ttf',
    text: 'Αθήνα και Ελλάδα',
    spacingPlain: 'ΑΒ',
    spaced: 'Α Β',
    zwsp: 'Α\u200BΒ',
    glyphs: ['Α', 'θ', 'ή', 'λ']
  },
  {
    label: 'Cyrillic Noto Sans',
    font: 'truetypefonts/noto/NotoSans-Regular.ttf',
    text: 'Привет мир',
    spacingPlain: 'ДЖ',
    spaced: 'Д Ж',
    zwsp: 'Д\u200BЖ',
    glyphs: ['П', 'р', 'и', 'Ж', 'Я']
  },
  {
    label: 'Cyrillic Source Sans 3',
    font: 'truetypefonts/curated/SourceSans3-Regular.otf',
    text: 'Привет мир',
    spacingPlain: 'ДЖ',
    spaced: 'Д Ж',
    zwsp: 'Д\u200BЖ',
    glyphs: ['П', 'р', 'и', 'Ж', 'Я']
  }
];

for (const c of CASES) {
  test(`script confidence: ${c.label} resolves representative glyphs`, () => {
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

  test(`script confidence: ${c.label} spacing and invisible controls stay sane`, () => {
    const font = loadFont(c.font);
    const plainWidth = width(font, c.spacingPlain);
    const spacedWidth = width(font, c.spaced);
    const zwspWidth = width(font, c.zwsp);

    assert.ok(spacedWidth > plainWidth, `expected space to widen ${c.label}`);
    assertNear(zwspWidth, plainWidth, 1e-9);
  });

  test(`script confidence: ${c.label} measured layout stays finite`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutStringAuto(c.text, { gpos: true });
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

  test(`script confidence: ${c.label} canvas and svg stay aligned`, () => {
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
