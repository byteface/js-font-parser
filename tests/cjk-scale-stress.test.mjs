import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFont } from './helpers/font-test-utils.mjs';

const FIXTURES = [
  {
    label: 'SC sans',
    path: 'truetypefonts/curated-extra/NotoSansCJKsc-Regular.otf',
    sample: '中文测试字体汉字布局性能',
    longToken: '中文排版稳定性'
  },
  {
    label: 'JP sans',
    path: 'truetypefonts/curated/NotoSansCJKjp-Regular.otf',
    sample: '日本語テキスト配置検証',
    longToken: 'かな漢字混在'
  },
  {
    label: 'KR sans',
    path: 'truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf',
    sample: '한글텍스트레이아웃검증',
    longToken: '한국어문장테스트'
  }
];

const cache = new Map();
function getFont(path) {
  if (!cache.has(path)) {
    cache.set(path, loadFont(path));
  }
  return cache.get(path);
}

test('cjk scale stress: large fixtures expose stable global metrics', () => {
  for (const fixture of FIXTURES) {
    const font = getFont(fixture.path);
    const glyphCount = font.getNumGlyphs();
    assert.ok(glyphCount > 10000, `expected large glyph count for ${fixture.label}`);
    assert.ok(Number.isFinite(font.getUnitsPerEm()), `expected unitsPerEm for ${fixture.label}`);
    assert.ok(Number.isFinite(font.getAscent()), `expected ascent for ${fixture.label}`);
    assert.ok(Number.isFinite(font.getDescent()), `expected descent for ${fixture.label}`);
  }
});

test('cjk scale stress: high-index glyph access near table boundaries is safe', () => {
  for (const fixture of FIXTURES) {
    const font = getFont(fixture.path);
    const count = font.getNumGlyphs();
    const indices = [
      count - 1,
      count - 2,
      Math.max(0, count - 32),
      Math.floor(count * 0.75),
      Math.floor(count * 0.5)
    ].filter((i, idx, arr) => i >= 0 && arr.indexOf(i) === idx);

    for (const gid of indices) {
      assert.doesNotThrow(() => font.getGlyph(gid), `getGlyph(${gid}) should not throw for ${fixture.label}`);
      const glyph = font.getGlyph(gid);
      if (glyph) {
        assert.ok(Number.isFinite(glyph.advanceWidth), `finite advance for gid ${gid} in ${fixture.label}`);
        assert.ok(Number.isFinite(glyph.getPointCount()), `finite point count for gid ${gid} in ${fixture.label}`);
      }
    }
  }
});

test('cjk scale stress: long-string layout and measure are finite and repeatable', () => {
  for (const fixture of FIXTURES) {
    const font = getFont(fixture.path);
    const text = Array.from({ length: 220 }, () => fixture.longToken).join('');

    const m1 = font.measureText(text, { gpos: true });
    const m2 = font.measureText(text, { gpos: true });
    assert.ok(Number.isFinite(m1.advanceWidth), `measureText width should be finite for ${fixture.label}`);
    assert.equal(m1.advanceWidth, m2.advanceWidth, `measureText should be stable for ${fixture.label}`);

    const layout = font.layoutStringAuto(text, { gpos: true });
    assert.ok(Array.isArray(layout), `layout should be array for ${fixture.label}`);
    assert.ok(layout.length > 0, `layout should not be empty for ${fixture.label}`);
    for (const item of layout.slice(0, 128)) {
      assert.ok(Number.isFinite(item.xAdvance), `xAdvance finite in ${fixture.label}`);
      assert.ok(Number.isFinite(item.xOffset ?? 0), `xOffset finite in ${fixture.label}`);
      assert.ok(Number.isFinite(item.yOffset ?? 0), `yOffset finite in ${fixture.label}`);
    }
  }
});

test('cjk scale stress: representative cmap lookups resolve broadly and stay safe for astral probe', () => {
  const astralProbe = '𠀋';
  for (const fixture of FIXTURES) {
    const font = getFont(fixture.path);
    let found = 0;
    for (const ch of Array.from(fixture.sample)) {
      const gid = font.getGlyphIndexByChar(ch);
      assert.ok(gid == null || Number.isInteger(gid), `glyph index shape for ${fixture.label}`);
      if (Number.isInteger(gid) && gid >= 0) found++;
    }
    assert.ok(found >= Math.max(2, Math.floor(fixture.sample.length * 0.6)), `expected broad cmap hits for ${fixture.label}`);

    assert.doesNotThrow(() => font.getGlyphIndexByChar(astralProbe), `astral probe should be safe for ${fixture.label}`);
  }
});
