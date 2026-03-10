import test from 'node:test';
import assert from 'node:assert/strict';
import { CanvasRenderer } from '../dist/render/CanvasRenderer.js';

import {
  assertNear,
  captureCanvasXs,
  captureColorCanvasXs,
  expectedLayoutXs,
  loadFont,
  svgWidth,
  width
} from './helpers/font-test-utils.mjs';

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

test('renderers: CanvasRenderer.drawString emits a draw step for blank space glyphs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const canvas = makeCanvas();
  const xs = [];
  const original = CanvasRenderer.drawGlyphToContext;
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

test('renderers: CanvasRenderer.drawStringWithKerning keeps spaced runs wider than plain runs', () => {
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

test('renderers: CanvasRenderer.drawStringWithKerning ignores ZWSP controls in Latin runs', () => {
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

test('renderers: SVG export width matches measured width for Latin kerning pairs', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'AV', { scale: 0.1 }), width(font, 'AV') * 0.1);
});

test('renderers: SVG export width matches measured width for Latin spaced text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(svgWidth(font, 'A V', { scale: 0.1 }), width(font, 'A V') * 0.1);
});

test('renderers: SVG export width ignores ZWSP inside Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u200BV', { scale: 0.1 }), width(font, 'A\u200BV') * 0.1);
});

test('renderers: SVG export width ignores trailing ZWSP in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'AV\u200B', { scale: 0.1 }), width(font, 'AV\u200B') * 0.1);
});

test('renderers: SVG export width ignores word joiner in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u2060V', { scale: 0.1 }), width(font, 'A\u2060V') * 0.1);
});

test('renderers: SVG export width ignores soft hyphen in Latin text without breaks', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assertNear(svgWidth(font, 'A\u00ADV', { scale: 0.1 }), width(font, 'A\u00ADV') * 0.1);
});

test('renderers: SVG export width stays aligned with Arabic shaping and marks', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(svgWidth(font, 'مُحَمَّد', { scale: 0.1 }), width(font, 'مُحَمَّد') * 0.1);
});

test('renderers: SVG export width stays aligned with Arabic ALM controls', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.equal(svgWidth(font, 'م\u061Cم', { scale: 0.1 }), width(font, 'م\u061Cم') * 0.1);
});

test('renderers: SVG export width applies letter spacing on top of measured advances', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const extra = 12;
  assertNear(svgWidth(font, 'AV', { scale: 0.1, letterSpacing: extra }), (width(font, 'AV') * 0.1) + extra);
});

test('renderers: SVG export width stays aligned for longer Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(svgWidth(font, 'AVATAR', { scale: 0.1 }), width(font, 'AVATAR') * 0.1);
});

test('renderers: CanvasRenderer.drawStringWithKerning matches shaped glyph count for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  const xs = captureCanvasXs(font, 'office');
  assert.equal(xs.length, font.layoutStringAuto('office', { gpos: true }).length);
});

test('renderers: CanvasRenderer.drawStringWithKerning matches shaped positions for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'office'), expectedLayoutXs(font, 'office'));
});

test('renderers: CanvasRenderer.drawStringWithKerning matches Arabic mark positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'مُحَمَّد'), expectedLayoutXs(font, 'مُحَمَّد'));
});

test('renderers: CanvasRenderer.drawStringWithKerning matches Devanagari cluster positioning', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  assert.deepEqual(captureCanvasXs(font, 'श्रृंखला'), expectedLayoutXs(font, 'श्रृंखला'));
});

test('renderers: CanvasRenderer.drawStringWithKerning matches Arabic ALM positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'م\u061Cم'), expectedLayoutXs(font, 'م\u061Cم'));
});

test('renderers: CanvasRenderer.drawStringWithKerning matches Latin ZWSP positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'A\u200BV'), expectedLayoutXs(font, 'A\u200BV'));
});

test('renderers: CanvasRenderer.drawStringWithKerning ignores trailing ZWSP draw steps in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'AV\u200B'), expectedLayoutXs(font, 'AV\u200B'));
});

test('renderers: CanvasRenderer.drawStringWithKerning matches Latin NBSP spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureCanvasXs(font, 'A\u00A0V'), expectedLayoutXs(font, 'A\u00A0V'));
});

test('renderers: CanvasRenderer.drawStringWithKerning preserves shaped positions with explicit spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'office', { spacing: 12 }),
    expectedLayoutXs(font, 'office', { spacing: 12 })
  );
});

test('renderers: CanvasRenderer.drawStringWithKerning preserves Arabic shaping with explicit x offset', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(
    captureCanvasXs(font, 'مُحَمَّد', { x: 25 }),
    expectedLayoutXs(font, 'مُحَمَّد', { x: 25 })
  );
});

test('renderers: CanvasRenderer.drawColorString matches shaped glyph count for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.equal(captureColorCanvasXs(font, 'office').length, font.layoutStringAuto('office', { gpos: true }).length);
});

test('renderers: CanvasRenderer.drawColorString matches shaped positions for Latin ligatures', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'office'), expectedLayoutXs(font, 'office'));
});

test('renderers: CanvasRenderer.drawColorString matches Arabic mark positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'مُحَمَّد'), expectedLayoutXs(font, 'مُحَمَّد'));
});

test('renderers: CanvasRenderer.drawColorString matches Devanagari cluster positioning', () => {
  const font = loadFont('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'श्रृंखला'), expectedLayoutXs(font, 'श्रृंखला'));
});

test('renderers: CanvasRenderer.drawColorString matches Arabic ALM positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoNaskhArabic-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'م\u061Cم'), expectedLayoutXs(font, 'م\u061Cم'));
});

test('renderers: CanvasRenderer.drawColorString matches Latin ZWSP positioning', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'A\u200BV'), expectedLayoutXs(font, 'A\u200BV'));
});

test('renderers: CanvasRenderer.drawColorString ignores trailing ZWSP draw steps in Latin text', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'AV\u200B'), expectedLayoutXs(font, 'AV\u200B'));
});

test('renderers: CanvasRenderer.drawColorString matches Latin NBSP spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(captureColorCanvasXs(font, 'A\u00A0V'), expectedLayoutXs(font, 'A\u00A0V'));
});

test('renderers: CanvasRenderer.drawColorString preserves shaped positions with explicit spacing', () => {
  const font = loadFont('truetypefonts/noto/NotoSans-Regular.ttf');
  assert.deepEqual(
    captureColorCanvasXs(font, 'office', { spacing: 12 }),
    expectedLayoutXs(font, 'office', { spacing: 12 })
  );
});

test('renderers: CanvasRenderer.drawColorString matches emoji glyph positions for color fonts', () => {
  const font = loadFont('truetypefonts/color/TwemojiMozilla.ttf');
  const xs = captureColorCanvasXs(font, '😀😀');
  const uniqueXs = Array.from(new Set(xs));
  assert.deepEqual(uniqueXs, expectedLayoutXs(font, '😀😀'));
});
