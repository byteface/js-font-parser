import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getGlyphPointsByChar,
  measureText,
  layoutToPoints,
  getColorLayersForGlyph,
  computeVariationCoords
} from '../dist/data/ParserApiShared.js';
import { pickBestCmapFormat } from '../dist/data/ParserShared.js';

function makeGlyph(points) {
  return {
    getPointCount() { return points.length; },
    getPoint(i) { return points[i] ?? null; }
  };
}

test('round7 edge: ParserApiShared.measureText should keep finite width with NaN letterSpacing', () => {
  const out = measureText('AB', { letterSpacing: Number.NaN }, () => [
    { glyphIndex: 1, xAdvance: 400, xOffset: 0, yOffset: 0 },
    { glyphIndex: 2, xAdvance: 500, xOffset: 0, yOffset: 0 }
  ]);
  assert.equal(Number.isFinite(out.advanceWidth), true);
  assert.equal(out.advanceWidth, 900);
});

test('round7 edge: ParserApiShared.measureText should coerce non-finite xAdvance values to 0', () => {
  const out = measureText('AB', {}, () => [
    { glyphIndex: 1, xAdvance: Number.NaN, xOffset: 0, yOffset: 0 },
    { glyphIndex: 2, xAdvance: Number.POSITIVE_INFINITY, xOffset: 0, yOffset: 0 }
  ]);
  assert.equal(Number.isFinite(out.advanceWidth), true);
  assert.equal(out.advanceWidth, 0);
});

test('round7 edge: ParserApiShared.layoutToPoints should keep finite outputs with unitsPerEm=0 and NaN options', () => {
  const out = layoutToPoints('A', {
    fontSize: Number.NaN,
    sampleStep: Number.NaN,
    letterSpacing: Number.NaN,
    x: Number.NaN,
    y: Number.NaN
  }, {
    layoutString() {
      return [{ glyphIndex: 1, xAdvance: 400, xOffset: Number.NaN, yOffset: Number.NaN }];
    },
    getGlyph() {
      return makeGlyph([{ x: 10, y: 20, onCurve: true, endOfContour: true }]);
    },
    getUnitsPerEm() {
      return 0;
    }
  });

  assert.equal(Number.isFinite(out.scale), true);
  assert.equal(Number.isFinite(out.advanceWidth), true);
  assert.equal(Number.isFinite(out.points[0].x), true);
  assert.equal(Number.isFinite(out.points[0].y), true);
});

test('round7 edge: ParserApiShared.layoutToPoints should sample all points when sampleStep is NaN', () => {
  const out = layoutToPoints('A', { sampleStep: Number.NaN }, {
    layoutString() {
      return [{ glyphIndex: 1, xAdvance: 10, xOffset: 0, yOffset: 0 }];
    },
    getGlyph() {
      return makeGlyph([
        { x: 1, y: 1, onCurve: true, endOfContour: false },
        { x: 2, y: 2, onCurve: true, endOfContour: false },
        { x: 3, y: 3, onCurve: true, endOfContour: true }
      ]);
    },
    getUnitsPerEm() {
      return 1000;
    }
  });

  assert.equal(out.points.length, 3);
});

test('round7 edge: ParserApiShared.getGlyphPointsByChar should sample all points when sampleStep is NaN', () => {
  const points = getGlyphPointsByChar('A', { sampleStep: Number.NaN }, () => makeGlyph([
    { x: 1, y: 1, onCurve: true, endOfContour: false },
    { x: 2, y: 2, onCurve: true, endOfContour: false },
    { x: 3, y: 3, onCurve: true, endOfContour: true }
  ]));

  assert.equal(points.length, 3);
});

test('round7 edge: ParserApiShared.getColorLayersForGlyph should not throw when palette getter returns null', () => {
  assert.doesNotThrow(() => getColorLayersForGlyph(1, 0, {
    hasColr: true,
    getLayersForGlyph() {
      return [{ glyphId: 10, paletteIndex: 0 }];
    },
    getPalette() {
      return null;
    }
  }));

  const out = getColorLayersForGlyph(1, 0, {
    hasColr: true,
    getLayersForGlyph() {
      return [{ glyphId: 10, paletteIndex: 0 }];
    },
    getPalette() {
      return null;
    }
  });

  assert.deepEqual(out, [{ glyphId: 10, color: null, paletteIndex: 0 }]);
});

test('round7 edge: ParserShared.pickBestCmapFormat should ignore null entries in format list', () => {
  assert.doesNotThrow(() => pickBestCmapFormat([
    null,
    { getFormatType: () => 4, mapCharCode: () => 55 }
  ]));

  const fmt = pickBestCmapFormat([
    null,
    { getFormatType: () => 4, mapCharCode: () => 55 }
  ]);

  assert.ok(fmt);
  assert.equal(typeof fmt.mapCharCode, 'function');
});

test('round7 edge: ParserApiShared.layoutToPoints should keep finite advanceWidth with non-finite layout advances', () => {
  const out = layoutToPoints('AB', {}, {
    layoutString() {
      return [
        { glyphIndex: 1, xAdvance: Number.NaN, xOffset: 0, yOffset: 0 },
        { glyphIndex: 2, xAdvance: Number.POSITIVE_INFINITY, xOffset: 0, yOffset: 0 }
      ];
    },
    getGlyph() {
      return makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);
    },
    getUnitsPerEm() {
      return 1000;
    }
  });

  assert.equal(Number.isFinite(out.advanceWidth), true);
  assert.equal(out.advanceWidth, 0);
});

test('round7 edge: ParserApiShared.computeVariationCoords should keep finite coords when axis bounds are NaN', () => {
  const coords = computeVariationCoords([
    { name: 'wght', minValue: Number.NaN, defaultValue: Number.NaN, maxValue: Number.NaN }
  ], { wght: 700 });
  assert.equal(coords.length, 1);
  assert.equal(Number.isFinite(coords[0]), true);
  assert.equal(coords[0], 0);
});

test('round7 edge: ParserApiShared.layoutToPoints should treat NaN origin values as 0', () => {
  const out = layoutToPoints('A', { x: Number.NaN, y: Number.NaN }, {
    layoutString() {
      return [{ glyphIndex: 1, xAdvance: 0, xOffset: 0, yOffset: 0 }];
    },
    getGlyph() {
      return makeGlyph([{ x: 12, y: 34, onCurve: true, endOfContour: true }]);
    },
    getUnitsPerEm() {
      return 1000;
    }
  });

  assert.equal(out.points[0].x, 12);
  assert.equal(out.points[0].y, -34);
});
