import test from 'node:test';
import assert from 'node:assert/strict';

import {
  measureText,
  layoutToPoints,
  getColorLayersForGlyph,
  getColorLayersForChar
} from '../dist/data/ParserApiShared.js';

function glyph(points) {
  return {
    getPointCount() { return points.length; },
    getPoint(i) { return points[i] ?? null; }
  };
}

test('round11 edge: measureText should not throw when layoutString throws', () => {
  assert.doesNotThrow(() => {
    const out = measureText('AB', {}, () => {
      throw new Error('layout-boom');
    });
    assert.equal(out.advanceWidth, 0);
    assert.equal(out.glyphCount, 0);
  });
});

test('round11 edge: measureText should tolerate non-array layoutString result', () => {
  const out = measureText('AB', {}, () => null);
  assert.equal(out.advanceWidth, 0);
  assert.equal(out.glyphCount, 0);
});

test('round11 edge: layoutToPoints should not throw when layoutString throws', () => {
  assert.doesNotThrow(() => {
    const out = layoutToPoints('A', {}, {
      layoutString() { throw new Error('layout-boom'); },
      getGlyph() { return null; },
      getUnitsPerEm() { return 1000; }
    });
    assert.equal(Array.isArray(out.points), true);
    assert.equal(out.points.length, 0);
    assert.equal(out.advanceWidth, 0);
  });
});

test('round11 edge: layoutToPoints should tolerate non-array layout and throwing getGlyph', () => {
  const out = layoutToPoints('AB', {}, {
    layoutString() { return { nope: true }; },
    getGlyph() { throw new Error('glyph-boom'); },
    getUnitsPerEm() { return 1000; }
  });
  assert.equal(out.points.length, 0);
  assert.equal(out.advanceWidth, 0);
});

test('round11 edge: layoutToPoints should skip glyph when getPointCount/getPoint throws', () => {
  const out = layoutToPoints('A', {}, {
    layoutString() { return [{ glyphIndex: 1, xAdvance: 500, xOffset: 0, yOffset: 0 }]; },
    getGlyph() {
      return {
        getPointCount() { throw new Error('count-boom'); },
        getPoint() { throw new Error('point-boom'); }
      };
    },
    getUnitsPerEm() { return 1000; }
  });
  assert.equal(out.points.length, 0);
  assert.equal(out.advanceWidth, 500);
});

test('round11 edge: getColorLayersForGlyph should not throw for non-array/throwing layer+palette deps', () => {
  assert.doesNotThrow(() => {
    const out = getColorLayersForGlyph(1, 0, {
      hasColr: true,
      getLayersForGlyph() { return null; },
      getPalette() { throw new Error('palette-boom'); }
    });
    assert.deepEqual(out, []);
  });
});

test('round11 edge: getColorLayersForChar should not throw when glyph index lookup throws', () => {
  assert.doesNotThrow(() => {
    const out = getColorLayersForChar('A', 0, {
      getGlyphIndexByChar() { throw new Error('glyph-index-boom'); },
      getColorLayersForGlyph() { return [{ glyphId: 1, color: '#000', paletteIndex: 0 }]; }
    });
    assert.deepEqual(out, []);
  });
});

test('round11 edge: getColorLayersForChar should tolerate non-array getColorLayersForGlyph result', () => {
  const out = getColorLayersForChar('A', 0, {
    getGlyphIndexByChar() { return 1; },
    getColorLayersForGlyph() { return null; }
  });
  assert.deepEqual(out, []);
});

test('round11 edge: layoutToPoints should keep finite result when getUnitsPerEm throws', () => {
  const out = layoutToPoints('A', { fontSize: 100 }, {
    layoutString() { return [{ glyphIndex: 1, xAdvance: 100, xOffset: 0, yOffset: 0 }]; },
    getGlyph() { return glyph([{ x: 1, y: 2, onCurve: true, endOfContour: true }]); },
    getUnitsPerEm() { throw new Error('upem-boom'); }
  });
  assert.equal(Number.isFinite(out.scale), true);
  assert.equal(Number.isFinite(out.advanceWidth), true);
  assert.equal(Number.isFinite(out.points[0].x), true);
  assert.equal(Number.isFinite(out.points[0].y), true);
});
