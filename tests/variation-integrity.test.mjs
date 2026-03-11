import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath);
}

function glyphSignature(glyph) {
  assert.ok(glyph, 'expected glyph');
  const pts = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < glyph.getPointCount(); i++) {
    const p = glyph.getPoint(i);
    if (p) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      pts.push([Math.round(p.x), Math.round(p.y), !!p.onCurve, !!p.endOfContour]);
    } else {
      pts.push(null);
    }
  }
  return {
    advanceWidth: glyph.advanceWidth,
    leftSideBearing: glyph.leftSideBearing,
    pointCount: glyph.getPointCount(),
    minX,
    maxX,
    minY,
    maxY,
    points: pts
  };
}

function getBounds(glyph) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < glyph.getPointCount(); i++) {
    const p = glyph.getPoint(i);
    if (!p) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

const FIXTURES = [
  {
    name: 'Roboto VF',
    path: 'truetypefonts/curated/Roboto-VF.ttf',
    sample: 'LEZT',
    probeChars: ['L', 'E', 'Z', 'T']
  },
  {
    name: 'Noto Sans Thai VF',
    path: 'truetypefonts/curated-extra/NotoSansThai-VF.ttf',
    sample: 'LEZT',
    probeChars: ['L', 'E', 'Z', 'T']
  },
  {
    name: 'Noto Sans Khmer VF',
    path: 'truetypefonts/curated-extra/NotoSansKhmer-VF.ttf',
    sample: 'LEZT',
    probeChars: ['L', 'E', 'Z', 'T']
  },
  {
    name: 'Noto Sans Lao VF',
    path: 'truetypefonts/curated-extra/NotoSansLao-VF.ttf',
    sample: 'LEZT',
    probeChars: ['L', 'E', 'Z', 'T']
  },
  {
    name: 'Source Serif 4 Variable Roman',
    path: 'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    sample: 'HAMB',
    probeChars: ['H', 'A', 'M', 'B']
  }
];

test('variation integrity: repeated default/max/default passes are deterministic and restore cleanly', () => {
  for (const fixture of FIXTURES) {
    const bytes = readBytes(fixture.path);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    assert.ok(axes.length > 0, `expected variation axes for ${fixture.name}`);

    const defaults = Object.fromEntries(axes.map((axis) => [axis.name, axis.defaultValue]));
    const maximums = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));

    for (const ch of fixture.probeChars) {
      font.setVariationByAxes(defaults);
      const defA = glyphSignature(font.getGlyphByChar(ch));
      const defB = glyphSignature(font.getGlyphByChar(ch));

      font.setVariationByAxes(maximums);
      const maxA = glyphSignature(font.getGlyphByChar(ch));
      const maxB = glyphSignature(font.getGlyphByChar(ch));

      font.setVariationByAxes(defaults);
      const defRestored = glyphSignature(font.getGlyphByChar(ch));

      assert.deepEqual(defA, defB, `${fixture.name} ${ch}: default read should be stable`);
      assert.deepEqual(maxA, maxB, `${fixture.name} ${ch}: max read should be stable`);
      assert.deepEqual(defRestored, defA, `${fixture.name} ${ch}: default should restore exactly after max`);
    }
  }
});

test('variation integrity: measured width and layout width agree at defaults and max axis values', () => {
  for (const fixture of FIXTURES) {
    const bytes = readBytes(fixture.path);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    const defaults = Object.fromEntries(axes.map((axis) => [axis.name, axis.defaultValue]));
    const maximums = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));

    for (const values of [defaults, maximums]) {
      font.setVariationByAxes(values);
      const measured = font.measureText(fixture.sample, { gpos: true }).advanceWidth;
      const layout = font.layoutStringAuto(fixture.sample, { gpos: true });
      const layoutWidth = layout.reduce((sum, item) => sum + (item.xAdvance ?? 0), 0);
      assert.ok(Number.isFinite(measured), `${fixture.name}: measured width should be finite`);
      assert.ok(Number.isFinite(layoutWidth), `${fixture.name}: layout width should be finite`);
      assert.ok(Math.abs(measured - layoutWidth) <= 1e-6, `${fixture.name}: measure/layout width mismatch`);
    }
  }
});

test('variation integrity: SEA variable fonts keep straight Latin stems sane at max weight', () => {
  const fixtures = FIXTURES.filter((fixture) => fixture.name.startsWith('Noto Sans '));
  for (const fixture of fixtures) {
    const bytes = readBytes(fixture.path);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    const maximums = Object.fromEntries(axes.map((axis) => [axis.name, axis.maxValue]));
    font.setVariationByAxes(maximums);

    const l = font.getGlyphByChar('L');
    const e = font.getGlyphByChar('E');
    const t = font.getGlyphByChar('T');
    assert.ok(l && e && t, `expected probe glyphs for ${fixture.name}`);
    const lBounds = getBounds(l);
    const eBounds = getBounds(e);
    const tBounds = getBounds(t);
    assert.ok(lBounds.maxX > lBounds.minX, `${fixture.name}: L should retain width`);
    assert.ok(eBounds.maxX > eBounds.minX, `${fixture.name}: E should retain width`);
    assert.ok(tBounds.maxX > tBounds.minX, `${fixture.name}: T should retain width`);
    assert.ok(tBounds.maxY > tBounds.minY, `${fixture.name}: T should retain height`);

    const l0 = l.getPoint(0);
    const l1 = l.getPoint(1);
    const l2 = l.getPoint(2);
    const l3 = l.getPoint(3);
    assert.ok(l0 && l1 && l2 && l3, `${fixture.name}: expected initial L stem points`);
    assert.ok(Math.abs(l0.x - l1.x) <= 2, `${fixture.name}: L outer stem should stay vertical`);
    assert.ok(Math.abs(l2.x - l3.x) <= 2, `${fixture.name}: L inner stem should stay vertical`);
  }
});
