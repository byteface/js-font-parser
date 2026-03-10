import test from 'node:test';
import assert from 'node:assert/strict';

import {
  captureCanvasXs,
  captureColorCanvasXs,
  expectedKerningScaledXs,
  expectedLayoutXs,
  kerningDelta,
  layoutAdvance,
  loadFont,
  svgWidth,
  width
} from './helpers/font-test-utils.mjs';

test('kerning behavior: Latin AV GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const a = font.getGlyphByChar('A');
  const v = font.getGlyphByChar('V');
  const expected = (a?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('A'), font.getGlyphIndexByChar('V'));
  assert.equal(font.layoutStringAuto('AV', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'AV'), expected + (v?.advanceWidth ?? 0));
});

test('kerning behavior: Latin To GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const t = font.getGlyphByChar('T');
  const o = font.getGlyphByChar('o');
  const expected = (t?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('T'), font.getGlyphIndexByChar('o'));
  assert.equal(font.layoutStringAuto('To', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'To'), expected + (o?.advanceWidth ?? 0));
});

test('kerning behavior: Latin LT GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const l = font.getGlyphByChar('L');
  const t = font.getGlyphByChar('T');
  const expected = (l?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('L'), font.getGlyphIndexByChar('T'));
  assert.equal(font.layoutStringAuto('LT', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'LT'), expected + (t?.advanceWidth ?? 0));
});

test('kerning behavior: negative Latin kerning stays single-applied for FA', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const f = font.getGlyphByChar('F');
  const a = font.getGlyphByChar('A');
  const expected = (f?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('F'), font.getGlyphIndexByChar('A'));
  assert.equal(font.layoutStringAuto('FA', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'FA'), expected + (a?.advanceWidth ?? 0));
});

test('kerning behavior: Hebrew kerning pair stays aligned across measure and SVG', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansHebrew-VF.ttf');
  const pair = 'לת';
  assert.equal(svgWidth(font, pair, { scale: 1 }), width(font, pair));
  assert.deepEqual(captureCanvasXs(font, pair), expectedLayoutXs(font, pair));
});

test('kerning behavior: Thai kerning pair stays aligned across measure and SVG', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansThai-VF.ttf');
  const pair = 'ไป';
  assert.equal(svgWidth(font, pair, { scale: 1 }), width(font, pair));
  assert.deepEqual(captureCanvasXs(font, pair), expectedLayoutXs(font, pair));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning matches AV pair positions exactly', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV'), expectedLayoutXs(font, 'AV'));
});

test('kerning behavior: CanvasRenderer.drawColorString matches AV pair positions exactly', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'AV'), expectedLayoutXs(font, 'AV'));
});

test('kerning behavior: layoutToPoints advance matches measured width for strong Latin kerning pair', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.layoutToPoints('To', { gpos: true }).advanceWidth, width(font, 'To'));
});

test('kerning behavior: non-GPOS layout width still matches measured width for AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const layout = font.layoutStringAuto('AV', { gpos: false });
  const widthFromLayout = layout.reduce((sum, item) => sum + item.xAdvance, 0);
  assert.equal(widthFromLayout, font.measureText('AV', { gpos: false }).advanceWidth);
});

test('kerning behavior: kerning:false removes total pair adjustment for Noto AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.ok(layoutAdvance(font, 'AV', { gpos: true, kerning: false }) > layoutAdvance(font, 'AV', { gpos: true, kerning: true }));
});

test('kerning behavior: kerning:false removes total pair adjustment for Gotham AV', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.ok(layoutAdvance(font, 'AV', { gpos: true, kerning: false }) > layoutAdvance(font, 'AV', { gpos: true, kerning: true }));
});

test('kerning behavior: kerning:false preserves Arabic mark placement while leaving advances stable', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  const noKern = font.layoutStringAuto('مُحَمَّد', { gpos: true, kerning: false });
  const withKern = font.layoutStringAuto('مُحَمَّد', { gpos: true, kerning: true });
  assert.deepEqual(noKern.map((item) => item.xOffset), withKern.map((item) => item.xOffset));
  assert.deepEqual(noKern.map((item) => item.yOffset), withKern.map((item) => item.yOffset));
});

test('kerning behavior: Gotham kerning slider baseline differs from full kerning for AVATAR advance', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.notEqual(layoutAdvance(font, 'AVATAR', { gpos: true, kerning: false }), layoutAdvance(font, 'AVATAR', { gpos: true, kerning: true }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning scale 0 matches non-kern AV layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 0 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 0 }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning scale 0.5 interpolates AV positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 0.5 }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning scale 1 matches kern AV layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 1 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 1 }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning interpolates To pair positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'To', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'To', { kerningScale: 0.5 }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning interpolates FA pair positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'FA', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'FA', { kerningScale: 0.5 }));
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning combines spacing with interpolated kerning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0.5, spacing: 12 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0.5, spacing: 12 })
  );
});

test('kerning behavior: CanvasRenderer.drawStringWithKerning preserves invisible controls while scaling kerning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'A\u200BV', { kerningScale: 0.5 }),
    expectedKerningScaledXs(font, 'A\u200BV', { kerningScale: 0.5 })
  );
});

test('kerning behavior: Gotham kerning scale 0 matches non-kern layout for AVATAR', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0 })
  );
});

test('kerning behavior: Gotham kerning scale 0.5 interpolates AVATAR positions', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0.5 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0.5 })
  );
});

test('kerning behavior: Gotham kerning scale 1 matches kern layout for AVATAR', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 1 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 1 })
  );
});

test('kerning behavior: kerning API matches layout delta for Noto AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.getKerningValue('A', 'V'), kerningDelta(font, 'AV'));
  assert.ok(font.getKerningValue('A', 'V') < 0);
});

test('kerning behavior: kerning API matches layout delta for Noto To', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.getKerningValue('T', 'o'), kerningDelta(font, 'To'));
  assert.ok(font.getKerningValue('T', 'o') < 0);
});

test('kerning behavior: kerning API matches layout delta for Gotham AV', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.equal(font.getKerningValue('A', 'V'), kerningDelta(font, 'AV'));
  assert.ok(font.getKerningValue('A', 'V') < 0);
});

test('kerning behavior: kerning API no longer returns absurd PairPos values for Bengali LT', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');
  const value = font.getKerningValue('L', 'T');
  assert.equal(value, kerningDelta(font, 'LT'));
  assert.ok(Math.abs(value) < 1000, `expected sane kerning magnitude, got ${value}`);
});

test('kerning behavior: kerning API no longer returns sentinel values for Devanagari To', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const value = font.getKerningValue('T', 'o');
  assert.equal(value, kerningDelta(font, 'To'));
  assert.notEqual(value, -32768);
});

test('kerning behavior: kerning API no longer returns sentinel values for Devanagari Yo', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const value = font.getKerningValue('Y', 'o');
  assert.equal(value, kerningDelta(font, 'Yo'));
  assert.notEqual(value, -32768);
});
