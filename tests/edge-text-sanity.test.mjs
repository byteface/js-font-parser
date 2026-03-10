import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';
import { CanvasRenderer } from '../dist/render/CanvasRenderer.js';
import { SVGFont } from '../dist/render/SVGFont.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFont(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const data = fs.readFileSync(fullPath);
  return FontParser.fromArrayBuffer(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

function width(font, text, options = {}) {
  return font.measureText(text, { gpos: true, ...options }).advanceWidth;
}

function makeCanvas() {
  return {
    getContext(kind) {
      if (kind !== '2d') return null;
      return {
        save() {},
        restore() {},
        translate() {},
        scale() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        quadraticCurveTo() {},
        bezierCurveTo() {},
        closePath() {},
        stroke() {},
        fill() {}
      };
    }
  };
}

function svgWidth(font, text, options = {}) {
  const svg = SVGFont.exportStringSvg(font, text, options);
  const match = svg.match(/width="([^"]+)"/);
  return match ? Number(match[1]) : Number.NaN;
}

function assertNear(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

function captureCanvasXs(font, text, options = {}) {
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, drawOptions = {}) {
    xs.push(drawOptions.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, text, canvas, { scale: 1, x: 0, y: 0, ...options });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  return xs;
}

function captureColorCanvasXs(font, text, options = {}) {
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, drawOptions = {}) {
    xs.push(drawOptions.x);
  };
  try {
    CanvasRenderer.drawColorString(font, text, canvas, { scale: 1, x: 0, y: 0, ...options });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  return xs;
}

function expectedLayoutXs(font, text, options = {}) {
  const layout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true })
    : font.layoutString(text, { gpos: true });
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const spacing = Number.isFinite(options.spacing) ? options.spacing : 0;
  const out = [];
  let penX = Number.isFinite(options.x) ? options.x : 0;
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    out.push(penX + ((item.xOffset ?? 0) * scale));
    penX += item.xAdvance * scale;
    if (i < layout.length - 1) penX += spacing;
  }
  return out;
}

function expectedKerningScaledXs(font, text, options = {}) {
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const spacing = Number.isFinite(options.spacing) ? options.spacing : 0;
  const kerningScale = Number.isFinite(options.kerningScale) ? options.kerningScale : 1;
  const originX = Number.isFinite(options.x) ? options.x : 0;
  const baseLayout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true, kerning: false })
    : font.layoutString(text, { gpos: true, kerning: false });
  const kernLayout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, { gpos: true, kerning: true })
    : font.layoutString(text, { gpos: true, kerning: true });
  assert.equal(baseLayout.length, kernLayout.length, 'expected comparable layouts for kerning interpolation');

  const out = [];
  let penX = originX;
  for (let i = 0; i < kernLayout.length; i++) {
    const baseItem = baseLayout[i];
    const kernItem = kernLayout[i];
    const xOffset = (baseItem.xOffset ?? 0) + (((kernItem.xOffset ?? 0) - (baseItem.xOffset ?? 0)) * kerningScale);
    const xAdvance = baseItem.xAdvance + ((kernItem.xAdvance - baseItem.xAdvance) * kerningScale);
    out.push(penX + (xOffset * scale));
    penX += xAdvance * scale;
    if (i < kernLayout.length - 1) penX += spacing;
  }
  return out;
}

function layoutAdvance(font, text, options = {}) {
  const layout = typeof font.layoutStringAuto === 'function'
    ? font.layoutStringAuto(text, options)
    : font.layoutString(text, options);
  return layout.reduce((sum, item) => sum + item.xAdvance, 0);
}

function kerningDelta(font, text) {
  return layoutAdvance(font, text, { gpos: true, kerning: true }) - layoutAdvance(font, text, { gpos: true, kerning: false });
}

test('text sanity: Latin space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const spaced = width(font, 'A V');
  const nbsp = width(font, 'A\u00A0V');
  const zwsp = width(font, 'A\u200BV');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.ok(zwsp < spaced);
});

test('text sanity: Arabic space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  const plain = width(font, 'مم');
  const spaced = width(font, 'م م');
  const nbsp = width(font, 'م\u00A0م');
  const zwsp = width(font, 'م\u200Bم');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text sanity: Bengali space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');
  const plain = width(font, 'কক');
  const spaced = width(font, 'ক ক');
  const nbsp = width(font, 'ক\u00A0ক');
  const zwsp = width(font, 'ক\u200Bক');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text sanity: Urdu space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf');
  const plain = width(font, 'مم');
  const spaced = width(font, 'م م');
  const nbsp = width(font, 'م\u00A0م');
  const zwsp = width(font, 'م\u200Bم');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text sanity: Korean space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf');
  const plain = width(font, '가가');
  const spaced = width(font, '가 가');
  const nbsp = width(font, '가\u00A0가');
  const zwsp = width(font, '가\u200B가');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text sanity: Devanagari space and NBSP widen text while ZWSP does not', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const plain = width(font, 'कक');
  const spaced = width(font, 'क क');
  const nbsp = width(font, 'क\u00A0क');
  const zwsp = width(font, 'क\u200Bक');
  assert.ok(spaced > plain);
  assert.equal(nbsp, spaced);
  assert.equal(zwsp, plain);
});

test('text sanity: space glyph points stay baseline-only while still affecting measured width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const spacePoints = font.getGlyphPointsByChar(' ');
  assert.ok(spacePoints.length >= 0);
  assert.ok(spacePoints.every((point) => point.y === 0), 'space glyph should not introduce vertical contours');
  assert.ok(width(font, 'A A') > width(font, 'AA'));
});

test('text sanity: layoutToPoints keeps spaced advance widths for Latin and Arabic', () => {
  const latin = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const arabic = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');

  const latinPoints = latin.layoutToPoints('A A', { gpos: true });
  const latinPlain = latin.layoutToPoints('AA', { gpos: true });
  assert.ok(latinPoints.advanceWidth > latinPlain.advanceWidth);

  const arabicPoints = arabic.layoutToPoints('م م', { gpos: true });
  const arabicPlain = arabic.layoutToPoints('مم', { gpos: true });
  assert.ok(arabicPoints.advanceWidth > arabicPlain.advanceWidth);
});

test('text sanity: CanvasRenderer.drawString emits a draw step for blank space glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, glyph, options = {}) {
    xs.push({ x: options.x, advanceWidth: glyph?.advanceWidth ?? 0 });
  };
  try {
    CanvasRenderer.drawString(font, 'A A', canvas, { scale: 0.1, x: 0, y: 100 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  assert.equal(xs.length, 3);
  assert.equal(xs[0].x, 0);
  assert.ok(xs[1].x > xs[0].x);
  assert.ok(xs[2].x > xs[1].x);
  assert.ok(xs[1].advanceWidth > 0, 'space glyph should still carry advance width');
});

test('text sanity: CanvasRenderer.drawStringWithKerning keeps spaced runs wider than plain runs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const plainXs = [];
  const spacedXs = [];

  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, options = {}) {
    plainXs.push(options.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, 'AV', canvas, { scale: 0.1, x: 0, y: 100 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }

  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, options = {}) {
    spacedXs.push(options.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, 'A V', canvas, { scale: 0.1, x: 0, y: 100 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }

  assert.equal(plainXs.length, 2);
  assert.equal(spacedXs.length, 3);
  assert.ok(spacedXs[2] > plainXs[1], 'space should push the third glyph further right');
});

test('text sanity: word joiner stays non-spacing in plain measurement and layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const joined = width(font, 'A\u2060V');
  assert.equal(joined, plain);

  const layout = font.layoutString('A\u2060V', { gpos: true });
  assert.equal(layout.length, 2);
  assert.deepEqual(layout.map((glyph) => glyph.xAdvance), font.layoutString('AV', { gpos: true }).map((glyph) => glyph.xAdvance));
});

test('text sanity: soft hyphen stays invisible in plain measurement and layout until line breaking logic handles it', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = width(font, 'AV');
  const softHyphen = width(font, 'A\u00ADV');
  assert.equal(softHyphen, plain);

  const layout = font.layoutString('A\u00ADV', { gpos: true });
  assert.equal(layout.length, 2);
  assert.deepEqual(layout.map((glyph) => glyph.xAdvance), font.layoutString('AV', { gpos: true }).map((glyph) => glyph.xAdvance));
});

test('text sanity: leading ZWSP does not affect Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, '\u200BAV'), width(font, 'AV'));
  assert.equal(font.layoutString('\u200BAV', { gpos: true }).length, 2);
});

test('text sanity: interstitial ZWSP does not disturb Latin kerning width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200BV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200BV', { gpos: true }).length, 2);
});

test('text sanity: trailing ZWSP does not change Latin width or add positioned glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'AV\u200B'), width(font, 'AV'));
  assert.equal(font.layoutString('AV\u200B', { gpos: true }).length, 2);
});

test('text sanity: repeated ZWSP controls stay invisible in Latin runs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200B\u200BV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200B\u200BV', { gpos: true }).length, 2);
});

test('text sanity: LRM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200EV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200EV', { gpos: true }).length, 2);
});

test('text sanity: RLM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\u200FV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\u200FV', { gpos: true }).length, 2);
});

test('text sanity: BOM does not disturb Latin width or glyph count', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(width(font, 'A\uFEFFV'), width(font, 'AV'));
  assert.equal(font.layoutString('A\uFEFFV', { gpos: true }).length, 2);
});

test('text sanity: ALM stays invisible in Arabic measurement and layout', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(width(font, 'م\u061Cم'), width(font, 'مم'));
  assert.equal(font.layoutString('م\u061Cم', { gpos: true }).length, 2);
});

test('text sanity: layoutToPoints advance ignores trailing ZWSP in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.layoutToPoints('AV\u200B', { gpos: true }).advanceWidth, font.layoutToPoints('AV', { gpos: true }).advanceWidth);
});

test('text sanity: CanvasRenderer.drawStringWithKerning ignores ZWSP controls in Latin runs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const canvas = makeCanvas();
  const original = CanvasRenderer.drawGlyphToContext;
  const xs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, options = {}) {
    xs.push(options.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, 'A\u200BV', canvas, { scale: 0.1, x: 0, y: 100 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  assert.equal(xs.length, 2);
  const plainXs = [];
  CanvasRenderer.drawGlyphToContext = function patched(_context, _glyph, options = {}) {
    plainXs.push(options.x);
  };
  try {
    CanvasRenderer.drawStringWithKerning(font, 'AV', canvas, { scale: 0.1, x: 0, y: 100 });
  } finally {
    CanvasRenderer.drawGlyphToContext = original;
  }
  assert.deepEqual(xs, plainXs);
});

test('text sanity: SVG export width matches measured width for Latin kerning pairs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'AV', { scale: 0.1 }), width(font, 'AV') * 0.1);
});

test('text sanity: SVG export width matches measured width for Latin spaced text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(svgWidth(font, 'A V', { scale: 0.1 }), width(font, 'A V') * 0.1);
});

test('text sanity: SVG export width ignores ZWSP inside Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u200BV', { scale: 0.1 }), width(font, 'A\u200BV') * 0.1);
});

test('text sanity: SVG export width ignores trailing ZWSP in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'AV\u200B', { scale: 0.1 }), width(font, 'AV\u200B') * 0.1);
});

test('text sanity: SVG export width ignores word joiner in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u2060V', { scale: 0.1 }), width(font, 'A\u2060V') * 0.1);
});

test('text sanity: SVG export width ignores soft hyphen in Latin text without breaks', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u00ADV', { scale: 0.1 }), width(font, 'A\u00ADV') * 0.1);
});

test('text sanity: SVG export width stays aligned with Arabic shaping and marks', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(svgWidth(font, 'مُحَمَّد', { scale: 0.1 }), width(font, 'مُحَمَّد') * 0.1);
});

test('text sanity: SVG export width stays aligned with Arabic ALM controls', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(svgWidth(font, 'م\u061Cم', { scale: 0.1 }), width(font, 'م\u061Cم') * 0.1);
});

test('text sanity: SVG export width applies letter spacing on top of measured advances', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const extra = 12;
  assertNear(svgWidth(font, 'AV', { scale: 0.1, letterSpacing: extra }), (width(font, 'AV') * 0.1) + extra);
});

test('text sanity: SVG export width stays aligned for longer Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(svgWidth(font, 'AVATAR', { scale: 0.1 }), width(font, 'AVATAR') * 0.1);
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches shaped glyph count for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const xs = captureCanvasXs(font, 'office');
  assert.equal(xs.length, font.layoutStringAuto('office', { gpos: true }).length);
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches shaped positions for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'office'), expectedLayoutXs(font, 'office'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches Arabic mark positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'مُحَمَّد'), expectedLayoutXs(font, 'مُحَمَّد'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches Devanagari cluster positioning', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  assert.deepEqual(captureCanvasXs(font, 'श्रृंखला'), expectedLayoutXs(font, 'श्रृंखला'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches Arabic ALM positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'م\u061Cم'), expectedLayoutXs(font, 'م\u061Cم'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches Latin ZWSP positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'A\u200BV'), expectedLayoutXs(font, 'A\u200BV'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning ignores trailing ZWSP draw steps in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV\u200B'), expectedLayoutXs(font, 'AV\u200B'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches Latin NBSP spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'A\u00A0V'), expectedLayoutXs(font, 'A\u00A0V'));
});

test('text sanity: CanvasRenderer.drawStringWithKerning preserves shaped positions with explicit spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'office', { spacing: 12 }),
    expectedLayoutXs(font, 'office', { spacing: 12 })
  );
});

test('text sanity: CanvasRenderer.drawStringWithKerning preserves Arabic shaping with explicit x offset', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'مُحَمَّد', { x: 25 }),
    expectedLayoutXs(font, 'مُحَمَّد', { x: 25 })
  );
});

test('text sanity: CanvasRenderer.drawColorString matches shaped glyph count for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(captureColorCanvasXs(font, 'office').length, font.layoutStringAuto('office', { gpos: true }).length);
});

test('text sanity: CanvasRenderer.drawColorString matches shaped positions for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'office'), expectedLayoutXs(font, 'office'));
});

test('text sanity: CanvasRenderer.drawColorString matches Arabic mark positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'مُحَمَّد'), expectedLayoutXs(font, 'مُحَمَّد'));
});

test('text sanity: CanvasRenderer.drawColorString matches Devanagari cluster positioning', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'श्रृंखला'), expectedLayoutXs(font, 'श्रृंखला'));
});

test('text sanity: CanvasRenderer.drawColorString matches Arabic ALM positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'م\u061Cم'), expectedLayoutXs(font, 'م\u061Cم'));
});

test('text sanity: CanvasRenderer.drawColorString matches Latin ZWSP positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'A\u200BV'), expectedLayoutXs(font, 'A\u200BV'));
});

test('text sanity: CanvasRenderer.drawColorString ignores trailing ZWSP draw steps in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'AV\u200B'), expectedLayoutXs(font, 'AV\u200B'));
});

test('text sanity: CanvasRenderer.drawColorString matches Latin NBSP spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'A\u00A0V'), expectedLayoutXs(font, 'A\u00A0V'));
});

test('text sanity: CanvasRenderer.drawColorString preserves shaped positions with explicit spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureColorCanvasXs(font, 'office', { spacing: 12 }),
    expectedLayoutXs(font, 'office', { spacing: 12 })
  );
});

test('text sanity: CanvasRenderer.drawColorString matches emoji glyph positions for color fonts', () => {
  const font = loadFont('truetypefonts/color/TwemojiMozilla.ttf');
  const xs = captureColorCanvasXs(font, '😀😀');
  const uniqueXs = Array.from(new Set(xs));
  assert.deepEqual(uniqueXs, expectedLayoutXs(font, '😀😀'));
});

test('text sanity: Latin AV GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const a = font.getGlyphByChar('A');
  const v = font.getGlyphByChar('V');
  const expected = (a?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('A'), font.getGlyphIndexByChar('V'));
  assert.equal(font.layoutStringAuto('AV', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'AV'), expected + (v?.advanceWidth ?? 0));
});

test('text sanity: Latin To GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const t = font.getGlyphByChar('T');
  const o = font.getGlyphByChar('o');
  const expected = (t?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('T'), font.getGlyphIndexByChar('o'));
  assert.equal(font.layoutStringAuto('To', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'To'), expected + (o?.advanceWidth ?? 0));
});

test('text sanity: Latin LT GPOS kerning is applied once in layout width', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const l = font.getGlyphByChar('L');
  const t = font.getGlyphByChar('T');
  const expected = (l?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('L'), font.getGlyphIndexByChar('T'));
  assert.equal(font.layoutStringAuto('LT', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'LT'), expected + (t?.advanceWidth ?? 0));
});

test('text sanity: negative Latin kerning stays single-applied for FA', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const f = font.getGlyphByChar('F');
  const a = font.getGlyphByChar('A');
  const expected = (f?.advanceWidth ?? 0) + font.getGposKerningValueByGlyphs(font.getGlyphIndexByChar('F'), font.getGlyphIndexByChar('A'));
  assert.equal(font.layoutStringAuto('FA', { gpos: true })[0].xAdvance, expected);
  assert.equal(width(font, 'FA'), expected + (a?.advanceWidth ?? 0));
});

test('text sanity: Hebrew kerning pair stays aligned across measure and SVG', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansHebrew-VF.ttf');
  const pair = 'לת';
  assert.equal(svgWidth(font, pair, { scale: 1 }), width(font, pair));
  assert.deepEqual(captureCanvasXs(font, pair), expectedLayoutXs(font, pair));
});

test('text sanity: Thai kerning pair stays aligned across measure and SVG', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansThai-VF.ttf');
  const pair = 'ไป';
  assert.equal(svgWidth(font, pair, { scale: 1 }), width(font, pair));
  assert.deepEqual(captureCanvasXs(font, pair), expectedLayoutXs(font, pair));
});

test('text sanity: CanvasRenderer.drawStringWithKerning matches AV pair positions exactly', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV'), expectedLayoutXs(font, 'AV'));
});

test('text sanity: CanvasRenderer.drawColorString matches AV pair positions exactly', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'AV'), expectedLayoutXs(font, 'AV'));
});

test('text sanity: layoutToPoints advance matches measured width for strong Latin kerning pair', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.layoutToPoints('To', { gpos: true }).advanceWidth, width(font, 'To'));
});

test('text sanity: non-GPOS layout width still matches measured width for AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const layout = font.layoutStringAuto('AV', { gpos: false });
  const widthFromLayout = layout.reduce((sum, item) => sum + item.xAdvance, 0);
  assert.equal(widthFromLayout, font.measureText('AV', { gpos: false }).advanceWidth);
});

test('text sanity: kerning:false removes total pair adjustment for Noto AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.ok(layoutAdvance(font, 'AV', { gpos: true, kerning: false }) > layoutAdvance(font, 'AV', { gpos: true, kerning: true }));
});

test('text sanity: kerning:false removes total pair adjustment for Gotham AV', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.ok(layoutAdvance(font, 'AV', { gpos: true, kerning: false }) > layoutAdvance(font, 'AV', { gpos: true, kerning: true }));
});

test('text sanity: kerning:false preserves Arabic mark placement while leaving advances stable', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  const noKern = font.layoutStringAuto('مُحَمَّد', { gpos: true, kerning: false });
  const withKern = font.layoutStringAuto('مُحَمَّد', { gpos: true, kerning: true });
  assert.deepEqual(noKern.map((item) => item.xOffset), withKern.map((item) => item.xOffset));
  assert.deepEqual(noKern.map((item) => item.yOffset), withKern.map((item) => item.yOffset));
});

test('text sanity: Gotham kerning slider baseline differs from full kerning for AVATAR advance', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.notEqual(layoutAdvance(font, 'AVATAR', { gpos: true, kerning: false }), layoutAdvance(font, 'AVATAR', { gpos: true, kerning: true }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning scale 0 matches non-kern AV layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 0 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 0 }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning scale 0.5 interpolates AV positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 0.5 }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning scale 1 matches kern AV layout', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV', { kerningScale: 1 }), expectedKerningScaledXs(font, 'AV', { kerningScale: 1 }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning interpolates To pair positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'To', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'To', { kerningScale: 0.5 }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning interpolates FA pair positions', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'FA', { kerningScale: 0.5 }), expectedKerningScaledXs(font, 'FA', { kerningScale: 0.5 }));
});

test('text sanity: CanvasRenderer.drawStringWithKerning combines spacing with interpolated kerning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0.5, spacing: 12 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0.5, spacing: 12 })
  );
});

test('text sanity: CanvasRenderer.drawStringWithKerning preserves invisible controls while scaling kerning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'A\u200BV', { kerningScale: 0.5 }),
    expectedKerningScaledXs(font, 'A\u200BV', { kerningScale: 0.5 })
  );
});

test('text sanity: Gotham kerning scale 0 matches non-kern layout for AVATAR', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0 })
  );
});

test('text sanity: Gotham kerning scale 0.5 interpolates AVATAR positions', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 0.5 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 0.5 })
  );
});

test('text sanity: Gotham kerning scale 1 matches kern layout for AVATAR', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.deepEqual(
    captureCanvasXs(font, 'AVATAR', { kerningScale: 1 }),
    expectedKerningScaledXs(font, 'AVATAR', { kerningScale: 1 })
  );
});

test('text sanity: kerning API matches layout delta for Noto AV', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.getKerningValue('A', 'V'), kerningDelta(font, 'AV'));
  assert.ok(font.getKerningValue('A', 'V') < 0);
});

test('text sanity: kerning API matches layout delta for Noto To', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(font.getKerningValue('T', 'o'), kerningDelta(font, 'To'));
  assert.ok(font.getKerningValue('T', 'o') < 0);
});

test('text sanity: kerning API matches layout delta for Gotham AV', () => {
  const font = loadFont('truetypefonts/GothamNarrow-Ultra.otf');
  assert.equal(font.getKerningValue('A', 'V'), kerningDelta(font, 'AV'));
  assert.ok(font.getKerningValue('A', 'V') < 0);
});

test('text sanity: kerning API no longer returns absurd PairPos values for Bengali LT', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');
  const value = font.getKerningValue('L', 'T');
  assert.equal(value, kerningDelta(font, 'LT'));
  assert.ok(Math.abs(value) < 1000, `expected sane kerning magnitude, got ${value}`);
});

test('text sanity: kerning API no longer returns sentinel values for Devanagari To', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const value = font.getKerningValue('T', 'o');
  assert.equal(value, kerningDelta(font, 'To'));
  assert.notEqual(value, -32768);
});

test('text sanity: kerning API no longer returns sentinel values for Devanagari Yo', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  const value = font.getKerningValue('Y', 'o');
  assert.equal(value, kerningDelta(font, 'Yo'));
  assert.notEqual(value, -32768);
});
