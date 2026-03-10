import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFont } from './helpers/font-test-utils.mjs';

function shapeSnapshot(font, text, options) {
  const layout = font.layoutString(text, options);
  return layout.map((g) => ({
    glyphIndex: g.glyphIndex,
    xAdvance: g.xAdvance,
    xOffset: g.xOffset,
    yOffset: g.yOffset,
    yAdvance: g.yAdvance
  }));
}

const CASES = [
  {
    name: 'Latin ligature+mark (Noto Sans: fi + acute)',
    font: 'truetypefonts/noto/NotoSans-Regular.ttf',
    text: 'fi\u0301',
    options: {
      gsubFeatures: ['liga', 'rlig', 'ccmp', 'mark', 'mkmk'],
      scriptTags: ['latn', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    },
    expected: [
      { glyphIndex: 1654, xAdvance: 602, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 2665, xAdvance: 0, xOffset: 745, yOffset: -536, yAdvance: 0 }
    ]
  },
  {
    name: 'Arabic stacked marks (Noto Naskh Arabic: ba + shadda + fatha)',
    font: 'truetypefonts/noto/NotoNaskhArabic-Regular.ttf',
    text: 'بَّ',
    options: {
      gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
      scriptTags: ['arab', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
    },
    expected: [
      { glyphIndex: 15, xAdvance: 817, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 323, xAdvance: 0, xOffset: 338, yOffset: -100, yAdvance: 0 },
      { glyphIndex: 374, xAdvance: 0, xOffset: 309, yOffset: -1046, yAdvance: 0 },
      { glyphIndex: 380, xAdvance: 0, xOffset: 307, yOffset: -924, yAdvance: 0 }
    ]
  },
  {
    name: 'Arabic mixed mark/ligature stack sample (Noto Naskh Arabic: اللّٰه)',
    font: 'truetypefonts/noto/NotoNaskhArabic-Regular.ttf',
    text: 'اللّٰه',
    options: {
      gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
      scriptTags: ['arab', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
    },
    expected: [
      { glyphIndex: 9, xAdvance: 253, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 67, xAdvance: 591, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 67, xAdvance: 591, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 374, xAdvance: 0, xOffset: 371, yOffset: -410, yAdvance: 0 },
      { glyphIndex: 420, xAdvance: 0, xOffset: 443, yOffset: -288, yAdvance: 0 },
      { glyphIndex: 81, xAdvance: 452, xOffset: 0, yOffset: 0, yAdvance: 0 }
    ]
  },
  {
    name: 'Devanagari canonical cluster (Noto Sans Devanagari: श्रृंखला)',
    font: 'truetypefonts/noto/NotoSansDevanagari-Regular.ttf',
    text: 'श्रृंखला',
    options: {
      gsubFeatures: ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
      scriptTags: ['deva', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    },
    expected: [
      { glyphIndex: 254, xAdvance: 425, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 82, xAdvance: 409, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 36, xAdvance: 0, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 100, xAdvance: 0, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 57, xAdvance: 818, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 83, xAdvance: 678, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 31, xAdvance: 259, xOffset: 0, yOffset: 0, yAdvance: 0 }
    ]
  },
  {
    name: 'Bengali canonical cluster (Noto Sans Bengali VF: কীর্তি)',
    font: 'truetypefonts/curated-extra/NotoSansBengali-VF.ttf',
    text: 'কীর্তি',
    options: {
      gsubFeatures: ['locl', 'ccmp', 'nukt', 'akhn'],
      scriptTags: ['beng', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    },
    expected: [
      { glyphIndex: 25, xAdvance: 807, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 61, xAdvance: 266, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 51, xAdvance: 596, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 70, xAdvance: 0, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 40, xAdvance: 707, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 60, xAdvance: 266, xOffset: 0, yOffset: 0, yAdvance: 0 }
    ]
  },
  {
    name: 'Hebrew marks (Noto Sans Hebrew: שָׁלוֹם)',
    font: 'truetypefonts/noto/NotoSansHebrew-Regular.ttf',
    text: 'שָׁלוֹם',
    options: {
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['hebr', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    },
    expected: [
      { glyphIndex: 96, xAdvance: 730, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 79, xAdvance: 0, xOffset: 227, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 100, xAdvance: 0, xOffset: 284, yOffset: -537, yAdvance: 0 },
      { glyphIndex: 55, xAdvance: 522, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 124, xAdvance: 301, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 46, xAdvance: 0, xOffset: 91, yOffset: -537, yAdvance: 0 },
      { glyphIndex: 23, xAdvance: 684, xOffset: 0, yOffset: 0, yAdvance: 0 }
    ]
  },
  {
    name: 'Thai marks (Noto Sans Thai Looped: ผู้ใหญ่)',
    font: 'truetypefonts/noto/NotoSansThaiLooped-Regular.ttf',
    text: 'ผู้ใหญ่',
    options: {
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['thai', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    },
    expected: [
      { glyphIndex: 41, xAdvance: 646, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 189, xAdvance: 0, xOffset: 646, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 158, xAdvance: 0, xOffset: 646, yOffset: -869, yAdvance: 0 },
      { glyphIndex: 71, xAdvance: 353, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 58, xAdvance: 660, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 18, xAdvance: 875, xOffset: 0, yOffset: 0, yAdvance: 0 },
      { glyphIndex: 155, xAdvance: 0, xOffset: 646, yOffset: -537, yAdvance: 0 }
    ]
  }
];

for (const c of CASES) {
  test(`GPOS sign-off canonical: ${c.name}`, () => {
    const font = loadFont(c.font);
    const actual = shapeSnapshot(font, c.text, c.options);
    assert.deepEqual(actual, c.expected);

    const markRows = actual.filter((row) => row.xAdvance === 0);
    assert.ok(markRows.length >= 1, 'expected at least one non-advancing mark/attached glyph');
  });
}
