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
  gsubFeatures: ['locl', 'ccmp', 'pref', 'blwf', 'abvf', 'pstf', 'liga', 'rlig'],
  gposFeatures: ['kern', 'mark', 'mkmk']
};

const SEA_CASES = [
  {
    label: 'Khmer sans',
    font: 'truetypefonts/curated-extra/NotoSansKhmer-VF.ttf',
    script: 'khmr',
    text: 'ភាសាខ្មែរ',
    spacingPlain: 'កម',
    spaced: 'ក ម',
    zwsp: 'ក\u200Bម',
    clusterText: 'ក្ខ',
    clusterMode: 'gsub',
    markText: 'កិ'
  },
  {
    label: 'Khmer serif',
    font: 'truetypefonts/curated-extra/NotoSerifKhmer-VF.ttf',
    script: 'khmr',
    text: 'ភាសាខ្មែរ',
    spacingPlain: 'កម',
    spaced: 'ក ម',
    zwsp: 'ក\u200Bម',
    clusterText: 'ក្ខ',
    clusterMode: 'gsub',
    markText: 'កិ'
  },
  {
    label: 'Myanmar sans',
    font: 'truetypefonts/curated-extra/NotoSansMyanmar-VF.ttf',
    script: 'mymr',
    text: 'မြန်မာဘာသာ',
    spacingPlain: 'ကမ',
    spaced: 'က မ',
    zwsp: 'က\u200Bမ',
    clusterText: 'ကိ',
    clusterMode: 'mark',
    markText: 'ကိ'
  },
  {
    label: 'Myanmar serif',
    font: 'truetypefonts/curated-extra/NotoSerifMyanmar-VF.ttf',
    script: 'mymr',
    text: 'မြန်မာဘာသာ',
    spacingPlain: 'ကမ',
    spaced: 'က မ',
    zwsp: 'က\u200Bမ',
    clusterText: 'ကိ',
    clusterMode: 'mark',
    markText: 'ကိ'
  },
  {
    label: 'Lao sans',
    font: 'truetypefonts/curated-extra/NotoSansLao-VF.ttf',
    script: 'lao ',
    text: 'ພາສາລາວ',
    spacingPlain: 'ກນ',
    spaced: 'ກ ນ',
    zwsp: 'ກ\u200Bນ',
    clusterText: 'ກ່',
    clusterMode: 'mark',
    markText: 'ກິ'
  },
  {
    label: 'Lao serif',
    font: 'truetypefonts/curated-extra/NotoSerifLao-VF.ttf',
    script: 'lao ',
    text: 'ພາສາລາວ',
    spacingPlain: 'ກນ',
    spaced: 'ກ ນ',
    zwsp: 'ກ\u200Bນ',
    clusterText: 'ກ່',
    clusterMode: 'mark',
    markText: 'ກິ'
  }
];

for (const c of SEA_CASES) {
  test(`sea confidence: ${c.label} parses and resolves representative glyphs`, () => {
    const font = loadFont(c.font);
    assert.ok(font.getNumGlyphs() > 0, `expected glyphs in ${c.label}`);

    for (const ch of Array.from(c.text.replace(/\s+/g, ''))) {
      const gid = font.getGlyphIndexByChar(ch);
      assert.ok(Number.isInteger(gid) && gid >= 0, `expected glyph index for '${ch}' in ${c.label}`);
      const glyph = font.getGlyphByChar(ch);
      assert.ok(glyph, `expected glyph for '${ch}' in ${c.label}`);
      assert.ok(Number.isFinite(glyph.advanceWidth), `expected finite advance for '${ch}' in ${c.label}`);
    }
  });

  test(`sea confidence: ${c.label} spacing and invisible controls stay sane`, () => {
    const font = loadFont(c.font);
    const plainWidth = width(font, c.spacingPlain);
    const spacedWidth = width(font, c.spaced);
    const zwspWidth = width(font, c.zwsp);

    assert.ok(spacedWidth > plainWidth, `expected space to widen ${c.label}`);
    assertNear(zwspWidth, plainWidth, 1e-9);
  });

  test(`sea confidence: ${c.label} canonical shaping sample shows script-specific shaping signal`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutString(c.clusterText, { ...BASE_OPTIONS, scriptTags: [c.script, 'DFLT'], gpos: true });
    assert.ok(Array.isArray(layout) && layout.length > 0, `expected layout for ${c.label}`);

    if (c.clusterMode === 'gsub') {
      const raw = Array.from(c.clusterText).map((ch) => font.getGlyphIndexByChar(ch));
      const shaped = font.getGlyphIndicesForStringWithGsub(
        c.clusterText,
        BASE_OPTIONS.gsubFeatures,
        [c.script.trim(), 'DFLT']
      );
      assert.notDeepEqual(shaped, raw, `expected GSUB shaping difference for ${c.label}`);
      return;
    }

    const hasZeroAdvanceMark = layout.some((g) => (g.xAdvance ?? 0) === 0);
    const hasOffset = layout.some((g) => (g.xOffset ?? 0) !== 0 || (g.yOffset ?? 0) !== 0);
    assert.ok(hasZeroAdvanceMark || hasOffset, `expected mark/reordering signal for ${c.label}`);
  });

  test(`sea confidence: ${c.label} mark sample shows attachment-style shaping signal`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutString(c.markText, { ...BASE_OPTIONS, scriptTags: [c.script, 'DFLT'], gpos: true });
    assert.ok(Array.isArray(layout) && layout.length > 0, `expected mark layout for ${c.label}`);

    const hasZeroAdvanceMark = layout.some((g) => (g.xAdvance ?? 0) === 0);
    const hasOffset = layout.some((g) => (g.xOffset ?? 0) !== 0 || (g.yOffset ?? 0) !== 0);
    assert.ok(hasZeroAdvanceMark || hasOffset, `expected mark-attachment signal in ${c.label}`);
  });

  test(`sea confidence: ${c.label} canvas and svg stay aligned with measured layout`, () => {
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
