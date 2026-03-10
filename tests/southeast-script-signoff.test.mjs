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

const SEA_CASES = [
  {
    label: 'Khmer',
    font: 'truetypefonts/curated-extra/NotoSansKhmer-VF.ttf',
    scriptTags: ['khmr', 'DFLT'],
    gsubFeatures: ['locl', 'ccmp'],
    gposFeatures: ['kern', 'mark', 'mkmk'],
    headline: 'ភាសាខ្មែរ',
    spacingPlain: 'កម',
    spaced: 'ក ម',
    zwsp: 'ក\u200Bម',
    samples: ['ភាសាខ្មែរ', 'អក្សរ', 'កម្ពុជា']
  },
  {
    label: 'Myanmar',
    font: 'truetypefonts/curated-extra/NotoSansMyanmar-VF.ttf',
    scriptTags: ['mymr', 'DFLT'],
    gsubFeatures: ['locl', 'ccmp'],
    gposFeatures: ['kern', 'mark', 'mkmk'],
    headline: 'မြန်မာစာ',
    spacingPlain: 'မန',
    spaced: 'မ န',
    zwsp: 'မ\u200Bန',
    samples: ['မြန်မာ', 'ကောင်းကင်', 'မြို့']
  },
  {
    label: 'Lao',
    font: 'truetypefonts/curated-extra/NotoSansLao-VF.ttf',
    scriptTags: ['lao ', 'DFLT'],
    gsubFeatures: ['locl', 'ccmp'],
    gposFeatures: ['kern', 'mark', 'mkmk'],
    headline: 'ພາສາລາວ',
    spacingPlain: 'ກມ',
    spaced: 'ກ ມ',
    zwsp: 'ກ\u200Bມ',
    samples: ['ພາສາລາວ', 'ສະບາຍດີ', 'ກຳລັງ']
  }
];

for (const c of SEA_CASES) {
  test(`southeast sign-off: ${c.label} parses and resolves representative glyphs`, () => {
    const font = loadFont(c.font);
    assert.ok(font.getNumGlyphs() > 0, `expected glyphs in ${c.label}`);
    for (const ch of Array.from(c.headline.replace(/\s+/g, ''))) {
      const gid = font.getGlyphIndexByChar(ch);
      assert.ok(Number.isInteger(gid) && gid >= 0, `expected glyph index for '${ch}' in ${c.label}`);
      const glyph = font.getGlyphByChar(ch);
      assert.ok(glyph, `expected glyph for '${ch}' in ${c.label}`);
      assert.equal(Number.isFinite(glyph.advanceWidth), true, `expected finite advance for '${ch}' in ${c.label}`);
    }
  });

  test(`southeast sign-off: ${c.label} spacing and invisible controls stay sane`, () => {
    const font = loadFont(c.font);
    const plainWidth = width(font, c.spacingPlain);
    const spacedWidth = width(font, c.spaced);
    const zwspWidth = width(font, c.zwsp);
    assert.ok(spacedWidth > plainWidth, `expected space to widen ${c.label}`);
    assertNear(zwspWidth, plainWidth, 1e-9);
  });

  test(`southeast sign-off: ${c.label} GSUB/GPOS layout is finite on script samples`, () => {
    const font = loadFont(c.font);
    let sawMarkGlyph = false;
    for (const text of c.samples) {
      const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, c.gsubFeatures, c.scriptTags);
      assert.ok(Array.isArray(glyphIndices) && glyphIndices.length > 0, `expected shaped glyphs for ${c.label}: "${text}"`);
      const laidOut = font.layoutString(text, {
        gsubFeatures: c.gsubFeatures,
        scriptTags: c.scriptTags,
        gpos: true,
        gposFeatures: c.gposFeatures
      });
      assert.ok(Array.isArray(laidOut) && laidOut.length > 0, `expected layout for ${c.label}: "${text}"`);
      assert.ok(laidOut.length <= glyphIndices.length, `unexpected layout growth for ${c.label}: "${text}"`);

      for (const g of laidOut) {
        assert.equal(Number.isFinite(g.xAdvance), true);
        assert.equal(Number.isFinite(g.yAdvance), true);
        assert.equal(Number.isFinite(g.xOffset), true);
        assert.equal(Number.isFinite(g.yOffset), true);
        const glyphClass = font.gdef?.getGlyphClass?.(g.glyphIndex) ?? 0;
        if (glyphClass === 3) {
          sawMarkGlyph = true;
          assert.equal(g.xAdvance, 0, `expected mark xAdvance=0 in ${c.label}: "${text}"`);
        }
      }
    }
    assert.equal(sawMarkGlyph, true, `expected at least one mark glyph in ${c.label} samples`);
  });

  test(`southeast sign-off: ${c.label} canvas and svg stay aligned`, () => {
    const font = loadFont(c.font);
    assert.deepEqual(
      captureCanvasXs(font, c.headline),
      expectedLayoutXs(font, c.headline),
      `expected canvas positions to match layout for ${c.label}`
    );
    assertNear(
      svgWidth(font, c.headline, { scale: 0.05 }),
      width(font, c.headline) * 0.05,
      1e-9
    );
  });
}
