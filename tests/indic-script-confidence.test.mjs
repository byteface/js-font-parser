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
  gsubFeatures: ['locl', 'ccmp', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
  gposFeatures: ['kern', 'mark', 'mkmk']
};

const INDIC_CASES = [
  {
    label: 'Tamil sans',
    font: 'truetypefonts/curated/NotoSansTamil-VF.ttf',
    script: 'taml',
    text: 'தமிழ் மொழி',
    spacingPlain: 'தம',
    spaced: 'த ம',
    zwsp: 'த\u200Bம',
    clusterText: 'க்ஷ',
    markText: 'கி'
  },
  {
    label: 'Tamil serif',
    font: 'truetypefonts/curated-extra/NotoSerifTamil-VF.ttf',
    script: 'taml',
    text: 'தமிழ் மொழி',
    spacingPlain: 'தம',
    spaced: 'த ம',
    zwsp: 'த\u200Bம',
    clusterText: 'க்ஷ',
    markText: 'கி'
  },
  {
    label: 'Malayalam sans',
    font: 'truetypefonts/curated-extra/NotoSansMalayalam-VF.ttf',
    script: 'mlym',
    text: 'മലയാളം ഭാഷ',
    spacingPlain: 'കമ',
    spaced: 'ക മ',
    zwsp: 'ക\u200Bമ',
    clusterText: 'ക്ഷി',
    markText: 'കി'
  },
  {
    label: 'Malayalam serif',
    font: 'truetypefonts/curated-extra/NotoSerifMalayalam-VF.ttf',
    script: 'mlym',
    text: 'മലയാളം ഭാഷ',
    spacingPlain: 'കമ',
    spaced: 'ക മ',
    zwsp: 'ക\u200Bമ',
    clusterText: 'ക്ഷി',
    markText: 'കി'
  },
  {
    label: 'Telugu sans',
    font: 'truetypefonts/curated-extra/NotoSansTelugu-VF.ttf',
    script: 'telu',
    text: 'తెలుగు భాష',
    spacingPlain: 'తగ',
    spaced: 'త గ',
    zwsp: 'త\u200Bగ',
    clusterText: 'క్షి',
    markText: 'కి'
  },
  {
    label: 'Telugu serif',
    font: 'truetypefonts/curated-extra/NotoSerifTelugu-VF.ttf',
    script: 'telu',
    text: 'తెలుగు భాష',
    spacingPlain: 'తగ',
    spaced: 'త గ',
    zwsp: 'త\u200Bగ',
    clusterText: 'క్షి',
    markText: 'కి'
  },
  {
    label: 'Sinhala sans',
    font: 'truetypefonts/curated-extra/NotoSansSinhala-VF.ttf',
    script: 'sinh',
    text: 'සිංහල භාෂාව',
    spacingPlain: 'සහ',
    spaced: 'ස හ',
    zwsp: 'ස\u200Bහ',
    clusterText: 'ර්‍ය',
    markText: 'කි'
  },
  {
    label: 'Sinhala serif',
    font: 'truetypefonts/curated-extra/NotoSerifSinhala-VF.ttf',
    script: 'sinh',
    text: 'සිංහල භාෂාව',
    spacingPlain: 'සහ',
    spaced: 'ස හ',
    zwsp: 'ස\u200Bහ',
    clusterText: 'ර්‍ය',
    markText: 'කි'
  },
  {
    label: 'Kannada sans',
    font: 'truetypefonts/curated-extra/NotoSansKannada-VF.ttf',
    script: 'knda',
    text: 'ಕನ್ನಡ ಭಾಷೆ',
    spacingPlain: 'ಕನ',
    spaced: 'ಕ ನ',
    zwsp: 'ಕ\u200Bನ',
    clusterText: 'ಕ್ಷಿ',
    markText: 'ಕಿ'
  },
  {
    label: 'Kannada serif',
    font: 'truetypefonts/curated-extra/NotoSerifKannada-VF.ttf',
    script: 'knda',
    text: 'ಕನ್ನಡ ಭಾಷೆ',
    spacingPlain: 'ಕನ',
    spaced: 'ಕ ನ',
    zwsp: 'ಕ\u200Bನ',
    clusterText: 'ಕ್ಷಿ',
    markText: 'ಕಿ'
  }
];

for (const c of INDIC_CASES) {
  test(`indic confidence: ${c.label} parses and resolves representative glyphs`, () => {
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

  test(`indic confidence: ${c.label} spacing and invisible controls stay sane`, () => {
    const font = loadFont(c.font);
    const plainWidth = width(font, c.spacingPlain);
    const spacedWidth = width(font, c.spaced);
    const zwspWidth = width(font, c.zwsp);

    assert.ok(spacedWidth > plainWidth, `expected space to widen ${c.label}`);
    assertNear(zwspWidth, plainWidth, 1e-9);
  });

  test(`indic confidence: ${c.label} canonical cluster shows GSUB shaping signal`, () => {
    const font = loadFont(c.font);
    const raw = Array.from(c.clusterText).map((ch) => font.getGlyphIndexByChar(ch));
    const shaped = font.getGlyphIndicesForStringWithGsub(
      c.clusterText,
      BASE_OPTIONS.gsubFeatures,
      [c.script, 'DFLT']
    );

    assert.ok(Array.isArray(shaped) && shaped.length > 0, `expected shaped glyphs for ${c.label}`);
    assert.notDeepEqual(shaped, raw, `expected GSUB shaping difference for ${c.label}`);
  });

  test(`indic confidence: ${c.label} mark sample shows attachment-style shaping signal`, () => {
    const font = loadFont(c.font);
    const layout = font.layoutString(c.markText, { ...BASE_OPTIONS, scriptTags: [c.script, 'DFLT'], gpos: true });
    assert.ok(Array.isArray(layout) && layout.length > 0, `expected mark layout for ${c.label}`);

    const hasZeroAdvanceMark = layout.some((g) => (g.xAdvance ?? 0) === 0);
    const hasOffset = layout.some((g) => (g.xOffset ?? 0) !== 0 || (g.yOffset ?? 0) !== 0);
    assert.ok(hasZeroAdvanceMark || hasOffset, `expected mark-attachment signal in ${c.label}`);
  });

  test(`indic confidence: ${c.label} canvas and svg stay aligned with measured layout`, () => {
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
