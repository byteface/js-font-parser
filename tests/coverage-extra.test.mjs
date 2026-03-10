import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ByteArray } from '../dist/utils/ByteArray.js';
import { detectScriptTags } from '../dist/utils/ScriptDetector.js';
import { Debug } from '../dist/utils/Debug.js';
import { FontParser } from '../dist/data/FontParser.js';
import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { FontParserWOFF2 } from '../dist/data/FontParserWOFF2.js';
import { GlyphData } from '../dist/data/GlyphData.js';
import { decodeWoff2, setWoff2Decoder } from '../dist/utils/Woff2Decoder.js';
import { Table } from '../dist/table/Table.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { SVGFont } from '../dist/render/SVGFont.js';
import { GsubTable } from '../dist/table/GsubTable.js';
import { GposTable } from '../dist/table/GposTable.js';
import { SingleSubst } from '../dist/table/SingleSubst.js';
import { MultipleSubst } from '../dist/table/MultipleSubst.js';
import { AlternateSubst } from '../dist/table/AlternateSubst.js';
import { LigatureSubst } from '../dist/table/LigatureSubst.js';
import { ContextSubst } from '../dist/table/ContextSubst.js';
import { ChainingSubst } from '../dist/table/ChainingSubst.js';
import { MarkLigPosFormat1 } from '../dist/table/MarkLigPosFormat1.js';
import { MarkBasePosFormat1 } from '../dist/table/MarkBasePosFormat1.js';
import { MarkMarkPosFormat1 } from '../dist/table/MarkMarkPosFormat1.js';
import { CursivePosFormat1 } from '../dist/table/CursivePosFormat1.js';
import { PairPosSubtable } from '../dist/table/PairPosSubtable.js';
import { SinglePosSubtable } from '../dist/table/SinglePosSubtable.js';
import { LigatureSubstFormat1 } from '../dist/table/LigatureSubstFormat1.js';
import { AlternateSubstFormat1 } from '../dist/table/AlternateSubstFormat1.js';
import { MultipleSubstFormat1 } from '../dist/table/MultipleSubstFormat1.js';
import { ContextSubstFormat1 } from '../dist/table/ContextSubstFormat1.js';
import { ContextSubstFormat2 } from '../dist/table/ContextSubstFormat2.js';
import { ContextSubstFormat3 } from '../dist/table/ContextSubstFormat3.js';
import { SinglePosFormat1 } from '../dist/table/SinglePosFormat1.js';
import { ColrTable } from '../dist/table/ColrTable.js';
import { CmapFormat0 } from '../dist/table/CmapFormat0.js';
import { CmapFormat2 } from '../dist/table/CmapFormat2.js';
import { CmapFormat6 } from '../dist/table/CmapFormat6.js';
import { CmapFormat8 } from '../dist/table/CmapFormat8.js';
import { CmapFormat10 } from '../dist/table/CmapFormat10.js';
import { CffTable } from '../dist/table/CffTable.js';
import { Cff2Table } from '../dist/table/Cff2Table.js';
import { GlyfCompositeDescript } from '../dist/table/GlyfCompositeDescript.js';
import { SvgTable } from '../dist/table/SvgTable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FULL_SWEEP = process.env.FULL_SWEEP === '1';
const testSweep = FULL_SWEEP ? test : test.skip;

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath);
}

function buildMinimalWoff({
  numTables = 1,
  totalSfntSize = 64,
  length = 64,
  entryOffset = 60,
  compLength = 4,
  origLength = 4
} = {}) {
  const minSize = numTables > 0 ? Math.max(length, entryOffset + compLength) : Math.max(length, 44);
  const buffer = new ArrayBuffer(minSize);
  const view = new DataView(buffer);
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false); // sfnt flavor
  view.setUint32(8, length, false);
  view.setUint16(12, numTables, false);
  view.setUint16(14, 0, false);
  view.setUint32(16, totalSfntSize, false);
  view.setUint16(20, 1, false);
  view.setUint16(22, 0, false);
  view.setUint32(24, 0, false);
  view.setUint32(28, 0, false);
  view.setUint32(32, 0, false);
  view.setUint32(36, 0, false);
  view.setUint32(40, 0, false);

  if (numTables > 0) {
    view.setUint32(44, 0x68656164, false); // 'head'
    view.setUint32(48, entryOffset, false);
    view.setUint32(52, compLength, false);
    view.setUint32(56, origLength, false);
    view.setUint32(60, 0, false);
    const bytes = new Uint8Array(buffer);
    for (let i = entryOffset; i < Math.min(bytes.length, entryOffset + compLength); i++) {
      bytes[i] = 0xAA;
    }
  }
  return buffer;
}

function listLocalFontFixtures() {
  const root = path.resolve(__dirname, '..', 'truetypefonts');
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ttf|otf|woff)$/i.test(entry.name)) {
        out.push(path.relative(path.resolve(__dirname, '..'), full));
      }
    }
  };
  walk(root);
  return out.sort();
}

const CURATED_FIXTURES = [
  'truetypefonts/curated/IBMPlexSerif-Regular.ttf',
  'truetypefonts/curated/FiraSans-Regular.ttf',
  'truetypefonts/curated/Inter-VF.ttf',
  'truetypefonts/curated/Roboto-VF.ttf',
  'truetypefonts/curated/NotoSerif-VF.ttf',
  'truetypefonts/curated/NotoSansTamil-VF.ttf',
  'truetypefonts/curated/NotoSansGeorgian-VF.ttf',
  'truetypefonts/curated/SourceSerif4-Regular.otf',
  'truetypefonts/curated/SourceSans3-Regular.otf',
  'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
  'truetypefonts/curated/SourceSerif4Variable-Italic.otf',
  'truetypefonts/curated/NotoSansCJKjp-Regular.otf',
  'truetypefonts/curated/NotoColorEmoji.ttf'
];

function createTtfParserMock() {
  const parser = Object.create(FontParserTTF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

function createWoffParserMock() {
  const parser = Object.create(FontParserWOFF.prototype);
  parser.diagnostics = [];
  parser.diagnosticKeys = new Set();
  return parser;
}

test('curated fixture list stays in sync with curated folder fonts', () => {
  const curatedDir = path.resolve(__dirname, '..', 'truetypefonts', 'curated');
  const actual = fs.readdirSync(curatedDir)
    .filter((name) => /\.(ttf|otf|woff)$/i.test(name))
    .map((name) => `truetypefonts/curated/${name}`)
    .sort();
  const listed = [...CURATED_FIXTURES].sort();
  assert.deepEqual(listed, actual);
});

test('ByteArray reads primitives and guards bounds', () => {
  const raw = new Uint8Array(24);
  const dv = new DataView(raw.buffer);
  dv.setUint8(0, 1);
  dv.setInt32(1, -42, false);
  dv.setUint32(5, 0x12345678, false);
  dv.setFloat32(9, 1.5, false);
  dv.setUint16(13, 500, false);
  dv.setInt16(15, -123, false);
  dv.setInt32(17, 0x00018000, false); // 1.5 fixed
  raw[21] = 0xAA;
  raw[22] = 0xBB;
  raw[23] = 0xCC;

  const ba = new ByteArray(raw);
  assert.equal(ba.readBool(), true);
  assert.equal(ba.readInt(), -42);
  assert.equal(ba.readUInt(), 0x12345678);
  assert.equal(ba.readFloat(), 1.5);
  assert.equal(ba.readUnsignedShort(), 500);
  assert.equal(ba.readShort(), -123);
  assert.equal(ba.readFixed(), 1.5);

  ba.seek(21);
  const bytes = ba.readBytes(3);
  assert.deepEqual(Array.from(bytes), [0xAA, 0xBB, 0xCC]);

  assert.throws(() => ba.seek(-1), /out of bounds/i);
  assert.throws(() => ba.readBytes(10), /exceeds buffer length/i);
});

test('detectScriptTags identifies script families and fallback', () => {
  const mixed = detectScriptTags('Hello Γειά שלום नमस्ते ไทย مرحبا');
  assert.ok(mixed.scripts.includes('latn'));
  assert.ok(mixed.scripts.includes('grek'));
  assert.ok(mixed.scripts.includes('hebr'));
  assert.ok(mixed.scripts.includes('deva'));
  assert.ok(mixed.scripts.includes('thai'));
  assert.ok(mixed.scripts.includes('arab'));
  assert.ok(mixed.features.includes('liga'));

  const fallback = detectScriptTags('😀😀😀');
  assert.deepEqual(fallback.scripts, ['DFLT']);
  assert.deepEqual(fallback.features, ['liga']);
});

test('Debug helper gates console calls', () => {
  const savedLog = console.log;
  const savedWarn = console.warn;
  const savedTable = console.table;
  const calls = [];
  console.log = (...args) => calls.push(['log', ...args]);
  console.warn = (...args) => calls.push(['warn', ...args]);
  console.table = (...args) => calls.push(['table', ...args]);
  try {
    Debug.enabled = false;
    Debug.log('x');
    Debug.warn('y');
    Debug.table({ z: 1 });
    assert.equal(calls.length, 0);

    Debug.enabled = true;
    Debug.log('a');
    Debug.warn('b');
    Debug.table({ c: 1 });
    assert.equal(calls.length, 3);
  } finally {
    Debug.enabled = false;
    console.log = savedLog;
    console.warn = savedWarn;
    console.table = savedTable;
  }
});

test('FontParser.fromArrayBuffer handles invalid and TTF buffers', () => {
  assert.throws(() => FontParser.fromArrayBuffer(new Uint8Array([0x00, 0x01]).buffer), /Invalid font buffer/);

  const ttfBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const ttf = FontParser.fromArrayBuffer(toArrayBuffer(ttfBytes));
  assert.ok(ttf instanceof FontParserTTF);
  assert.ok(ttf.getGlyphIndexByChar('A') > 0);
});

test('FontParser.fromArrayBuffer rejects truncated WOFF buffers', () => {
  const truncated = new Uint8Array([0x77, 0x4F, 0x46, 0x46, 0x00, 0x00, 0x00]); // "wOFF" + garbage
  assert.throws(() => FontParser.fromArrayBuffer(truncated.buffer), /WOFF|RangeError|out of bounds/i);
});

test('FontParser.fromArrayBuffer detects WOFF and exposes metadata helpers', () => {
  const woffBytes = readBytes('truetypefonts/ubuntu.woff');
  const parsed = FontParser.fromArrayBuffer(toArrayBuffer(woffBytes));
  assert.ok(parsed instanceof FontParserWOFF);
  const meta = parsed.getMetadata();
  assert.ok(meta && typeof meta === 'object');
  assert.ok(Array.isArray(meta.nameRecords));
  assert.equal(typeof parsed.isMonospace(), 'boolean');
  assert.equal(typeof parsed.getWeightClass(), 'number');
  assert.ok(Array.isArray(parsed.getFsTypeFlags()));
});

test('WOFF parser supports core glyph/layout methods and invalid input guards', () => {
  const woffBytes = readBytes('truetypefonts/ubuntu.woff');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(woffBytes));
  assert.ok(font instanceof FontParserWOFF);

  // Unhappy input paths
  assert.equal(font.getGlyphIndexByChar(''), null);
  assert.equal(font.getGlyphByChar('\u{1F4A9}'), null);
  assert.equal(font.getKerningValue('', 'A'), 0);
  assert.equal(font.getKerningValue('A', ''), 0);

  // Core happy-path API on WOFF
  const idx = font.getGlyphIndexByChar('A');
  assert.ok(idx === null || typeof idx === 'number');
  const glyph = font.getGlyphByChar('A');
  if (glyph) {
    assert.ok(glyph.getPointCount() > 0);
  }
  const laidOut = font.layoutString('Hello', { gsubFeatures: ['liga'], gpos: true });
  assert.ok(Array.isArray(laidOut));
  const gsub = font.getGlyphIndicesForStringWithGsub('office');
  assert.ok(Array.isArray(gsub));
});

test('OTF/CFF font parsing returns glyphs and metadata', () => {
  const otfBytes = readBytes('truetypefonts/GothamNarrow-Ultra.otf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(otfBytes));
  assert.ok(font instanceof FontParserTTF);
  const glyph = font.getGlyphByChar('A');
  assert.ok(glyph, 'expected CFF glyph from OTF');
  assert.ok(glyph.getPointCount() > 0);
  const names = font.getFontNames();
  assert.ok(names.family.length > 0 || names.fullName.length > 0);
});

test('CFF CID-keyed OTF smoke glyphs keep valid outlines', () => {
  const otfBytes = readBytes('truetypefonts/curated/NotoSansCJKjp-Regular.otf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(otfBytes));
  assert.ok(font instanceof FontParserTTF);

  for (const ch of ['h', 'e', 'o', 'd']) {
    const glyph = font.getGlyphByChar(ch);
    assert.ok(glyph, `expected glyph object for ${ch}`);
    assert.ok(glyph.getPointCount() > 0, `expected outline points for ${ch}`);
  }
});

test('curated fixture fonts parse and expose stable core metadata', () => {
  for (const fixture of CURATED_FIXTURES) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    assert.ok(font instanceof FontParserTTF, `expected TTF-compatible parser for ${fixture}`);

    // Metadata should always be structured, even if some fields are empty.
    const meta = font.getMetadata();
    assert.ok(meta && typeof meta === 'object', `metadata object for ${fixture}`);
    assert.ok(meta.names && typeof meta.names === 'object', `names section for ${fixture}`);
    assert.ok(Array.isArray(meta.nameRecords), `name records array for ${fixture}`);
    assert.equal(typeof meta.style.isItalic, 'boolean', `style.isItalic for ${fixture}`);
    assert.equal(typeof meta.style.isBold, 'boolean', `style.isBold for ${fixture}`);

    // Parsing should expose at least one core table and a non-negative glyph count.
    const cmap = font.getTableByType(Table.cmap);
    assert.ok(cmap, `cmap should exist for ${fixture}`);
    assert.ok(font.getNumGlyphs() >= 0, `glyph count should be non-negative for ${fixture}`);
  }
});

testSweep('all local truetypefonts fixtures are wired into parse smoke coverage', () => {
  const fixtures = listLocalFontFixtures();
  assert.ok(fixtures.length > 0, 'expected local font fixtures under truetypefonts');

  for (const fixture of fixtures) {
    const bytes = readBytes(fixture);
    let font = null;
    assert.doesNotThrow(() => {
      font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    }, `expected parser to accept fixture ${fixture}`);
    assert.ok(font, `expected font object for ${fixture}`);

    // Smoke-touch core APIs so fixture wiring guards against broad regressions.
    const glyphCount = font.getNumGlyphs?.() ?? 0;
    assert.ok(Number.isInteger(glyphCount) && glyphCount >= 0, `expected non-negative glyph count for ${fixture}`);
    assert.equal(typeof font.getAscent?.(), 'number', `expected ascent for ${fixture}`);
    assert.equal(typeof font.getDescent?.(), 'number', `expected descent for ${fixture}`);
  }
});

test('curated variable fonts expose variation axes and survive axis updates', () => {
  const variableFixtures = [
    'truetypefonts/curated/Inter-VF.ttf',
    'truetypefonts/curated/Roboto-VF.ttf',
    'truetypefonts/curated/NotoSerif-VF.ttf',
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];

  for (const fixture of variableFixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    assert.ok(Array.isArray(axes), `axes should be an array for ${fixture}`);

    if (axes.length > 0) {
      const minValues = Object.fromEntries(axes.map(a => [a.name, a.minValue]));
      const maxValues = Object.fromEntries(axes.map(a => [a.name, a.maxValue]));
      font.setVariationByAxes(minValues);
      font.setVariationByAxes(maxValues);
    }

    const layout = font.layoutStringAuto('Hello');
    assert.ok(Array.isArray(layout), `layout result should be an array for ${fixture}`);
  }
});

test('CFF2 variable OTF fixtures survive axis extremes and update outlines', () => {
  const cff2Fixtures = [
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];

  const getBbox = (glyph) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < glyph.getPointCount(); i++) {
      const p = glyph.getPoint(i);
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  };

  for (const fixture of cff2Fixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    assert.ok(font instanceof FontParserTTF);

    const axes = font.getVariationAxes();
    assert.ok(Array.isArray(axes), `expected axes array for ${fixture}`);
    assert.ok(axes.length > 0, `expected variable axes for ${fixture}`);

    const defaults = Object.fromEntries(axes.map(a => [a.name, a.defaultValue]));
    const mins = Object.fromEntries(axes.map(a => [a.name, a.minValue]));
    const maxs = Object.fromEntries(axes.map(a => [a.name, a.maxValue]));
    const outOfRange = Object.fromEntries(axes.map(a => [a.name, a.maxValue + (a.maxValue - a.minValue + 1)]));

    const gid = font.getGlyphIndexByChar('H');
    assert.ok(gid != null, `expected test glyph id for ${fixture}`);

    font.setVariationByAxes(defaults);
    const defaultGlyph = font.getGlyph(gid);
    assert.ok(defaultGlyph, `expected default glyph for ${fixture}`);
    const defaultBbox = getBbox(defaultGlyph);

    font.setVariationByAxes(mins);
    const minGlyph = font.getGlyph(gid);
    assert.ok(minGlyph, `expected min-axis glyph for ${fixture}`);
    const minBbox = getBbox(minGlyph);

    font.setVariationByAxes(maxs);
    const maxGlyph = font.getGlyph(gid);
    assert.ok(maxGlyph, `expected max-axis glyph for ${fixture}`);
    const maxBbox = getBbox(maxGlyph);

    for (const box of [defaultBbox, minBbox, maxBbox]) {
      assert.ok(Number.isFinite(box.minX) && Number.isFinite(box.minY) && Number.isFinite(box.maxX) && Number.isFinite(box.maxY));
    }
    assert.notDeepEqual(minBbox, maxBbox, `expected outline bbox to vary across axis extremes for ${fixture}`);

    // Out-of-range values should clamp safely and never produce NaN coords.
    font.setVariationByAxes(outOfRange);
    const clampedGlyph = font.getGlyph(gid);
    assert.ok(clampedGlyph, `expected clamped glyph for ${fixture}`);
    for (let i = 0; i < clampedGlyph.getPointCount(); i++) {
      const p = clampedGlyph.getPoint(i);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `expected finite point coordinates for ${fixture}`);
    }

    const layout = font.layoutString('Variable', { gsubFeatures: ['liga'], gpos: true });
    assert.ok(Array.isArray(layout), `expected layout for ${fixture}`);
  }
});

test('variation normalization guards zero-span axes', () => {
  let ttfCoords = null;
  const fakeTtf = {
    fvar: { axes: [{ name: 'wght', minValue: 400, defaultValue: 400, maxValue: 400 }] },
    setVariationCoords: (coords) => { ttfCoords = coords; }
  };
  FontParserTTF.prototype.setVariationByAxes.call(fakeTtf, { wght: 9999 });
  assert.deepEqual(ttfCoords, [0], 'expected zero-span axis normalization to stay finite for TTF');

  let woffCoords = null;
  const fakeWoff = {
    fvar: { axes: [{ name: 'wght', minValue: 400, defaultValue: 400, maxValue: 400 }] },
    setVariationCoords: (coords) => { woffCoords = coords; }
  };
  FontParserWOFF.prototype.setVariationByAxes.call(fakeWoff, { wght: -9999 });
  assert.deepEqual(woffCoords, [0], 'expected zero-span axis normalization to stay finite for WOFF');
});

test('CFF2 variable glyph sweep stays stable across axis extremes', () => {
  const fixtures = [
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];

  for (const fixture of fixtures) {
    const bytes = readBytes(fixture);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const axes = font.getVariationAxes();
    assert.ok(axes.length > 0, `expected axes in ${fixture}`);

    const extremes = [
      Object.fromEntries(axes.map(a => [a.name, a.minValue])),
      Object.fromEntries(axes.map(a => [a.name, a.maxValue]))
    ];

    const glyphLimit = Math.min(font.getNumGlyphs(), 600);
    for (const values of extremes) {
      font.setVariationByAxes(values);
      let checked = 0;
      for (let gid = 0; gid < glyphLimit; gid++) {
        let glyph = null;
        assert.doesNotThrow(() => {
          glyph = font.getGlyph(gid);
        }, `getGlyph should not throw for gid=${gid} in ${fixture}`);
        if (!glyph) continue;
        checked++;
        const pointCount = glyph.getPointCount();
        assert.ok(pointCount >= 0, `point count should be non-negative for gid=${gid} in ${fixture}`);
        for (let i = 0; i < pointCount; i++) {
          const p = glyph.getPoint(i);
          assert.ok(
            Number.isFinite(p.x) && Number.isFinite(p.y),
            `expected finite coordinates for gid=${gid}, point=${i} in ${fixture}`
          );
        }
      }
      assert.ok(checked > 100, `expected substantial parsed glyph coverage for ${fixture}`);
    }
  }
});

test('Color and variable font APIs return structured data', () => {
  const colorBytes = readBytes('truetypefonts/color/TwemojiMozilla.ttf');
  const colorFont = FontParser.fromArrayBuffer(toArrayBuffer(colorBytes));
  const layers = colorFont.getColorLayersForChar('😀');
  assert.ok(Array.isArray(layers));
  if (layers.length > 0) {
    assert.equal(typeof layers[0].glyphId, 'number');
  }

  // COLRv1: ensure paint trees can be flattened without throwing
  const colrBytes = readBytes('truetypefonts/color/colrv1/test_glyphs-glyf_colr_1.ttf');
  const colrFont = FontParser.fromArrayBuffer(toArrayBuffer(colrBytes));
  const colrGlyphId = colrFont.getGlyphIndexByChar('A') ?? 0;
  const colrLayers = colrFont.getColrV1LayersForGlyph(colrGlyphId, 0);
  assert.ok(Array.isArray(colrLayers));
  // Unhappy palette index should not throw and should produce null colors when palette is missing.
  const colrLayersMissingPalette = colrFont.getColrV1LayersForGlyph(colrGlyphId, 999);
  assert.ok(Array.isArray(colrLayersMissingPalette));

  // COLRv1 on a non-color font should be empty.
  const plainBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const plainFont = FontParser.fromArrayBuffer(toArrayBuffer(plainBytes));
  assert.deepEqual(plainFont.getColrV1LayersForGlyph(0), []);

  const colrTable = colrFont.getTableByType(Table.COLR);
  if (colrTable) {
    assert.doesNotThrow(() => colrTable.getPaintForGlyph(colrGlyphId));
    assert.doesNotThrow(() => colrTable.getClipForGlyph(colrGlyphId));
    assert.equal(colrTable.getPaintForGlyph(999999), null);
  }

  const varBytes = readBytes('truetypefonts/arimo/Arimo[wght].ttf');
  const varFont = FontParser.fromArrayBuffer(toArrayBuffer(varBytes));
  const axes = varFont.getVariationAxes();
  assert.ok(Array.isArray(axes));
  if (axes.length > 0) {
    const values = Object.fromEntries(axes.map(a => [a.name, a.defaultValue]));
    varFont.setVariationByAxes(values);
  }
  const laidOut = varFont.layoutStringAuto('Hello');
  assert.ok(laidOut.length > 0);
});

test('CFF fonts expose core metrics and reject empty glyph lookups', () => {
  const otfBytes = readBytes('truetypefonts/curated/SourceSerif4-Regular.otf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(otfBytes));
  assert.ok(font instanceof FontParserTTF);

  const post = font.getPostMetrics();
  assert.ok(post && typeof post.italicAngle === 'number');
  assert.equal(typeof font.isItalic(), 'boolean');
  assert.equal(typeof font.isMonospace(), 'boolean');

  assert.equal(font.getGlyphIndexByChar(''), null);
  assert.equal(font.getGlyphByChar(''), null);

  const cff = font.getTableByType(Table.CFF);
  if (cff) {
    assert.equal(cff.getGlyphDescription(-1), null);
    assert.equal(cff.getGlyphDescription(999999), null);
    const debug = cff.debugCharString(0);
    assert.ok(debug === null || Array.isArray(debug));
  }
});

test('SVG table API returns payload or null without throwing', async () => {
  const svgBytes = readBytes('truetypefonts/svg/TwitterColorEmoji-SVGinOT-15.1.0/TwitterColorEmoji-SVGinOT.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(svgBytes));
  assert.ok(font instanceof FontParserTTF);

  const gid = font.getGlyphIndexByChar('😀');
  if (gid != null) {
    const res = await font.getSvgDocumentForGlyphAsync(gid);
    assert.equal(typeof res.isCompressed, 'boolean');
    assert.ok(res.svgText === null || typeof res.svgText === 'string');
  }

  // Also exercise the no-svg path
  const plainBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const plain = FontParser.fromArrayBuffer(toArrayBuffer(plainBytes));
  const none = await plain.getSvgDocumentForGlyphAsync(1);
  assert.deepEqual(none, { svgText: null, isCompressed: false });
});

test('FontParser.load handles fetch success and HTTP failure', async () => {
  const savedFetch = globalThis.fetch;
  const ttfBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => toArrayBuffer(ttfBytes) });
    const font = await FontParser.load('https://example.test/font.ttf');
    assert.ok(font instanceof FontParserTTF);

    globalThis.fetch = async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) });
    await assert.rejects(() => FontParser.load('https://example.test/missing.ttf'), /HTTP error! Status: 404/);
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('TTF parser exposes stable null/empty behavior for missing data', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  assert.equal(font.getTableByType(0x12345678), null);
  assert.equal(font.getGlyph(999999), null);
  assert.equal(font.getNameRecord(9999), '');
  assert.deepEqual(font.getColorLayersForGlyph(999999), []);
  assert.deepEqual(font.getColorLayersForChar('\u{10FFFF}'), []);

  const detailed = font.getAllNameRecordsDetailed();
  assert.ok(detailed.length > 0);
  assert.equal(typeof detailed[0].platformId, 'number');
  assert.equal(typeof detailed[0].encodingId, 'number');
  assert.equal(typeof detailed[0].languageId, 'number');

  // Variation setters should be a no-op when no fvar is present.
  assert.doesNotThrow(() => font.setVariationByAxes({ wght: 700 }));
});

test('Layout engine supports auto direction and soft hyphens', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));

  const measure = (text) => {
    let width = 0;
    for (const ch of text) {
      const gid = font.getGlyphIndexByChar(ch);
      const glyph = gid != null ? font.getGlyph(gid) : null;
      width += glyph?.advanceWidth ?? 0;
    }
    return width;
  };

  const maxWidth = measure('hyphen') + measure('-') + 1;
  const layout = LayoutEngine.layoutText(font, 'hyphen\u00ADation', {
    maxWidth,
    hyphenate: 'soft',
    breakWords: true,
    direction: 'auto'
  });
  assert.ok(layout.lines.length >= 1);
  const firstLineChars = layout.lines[0].glyphs.map(g => g.char).join('');
  assert.ok(firstLineChars.includes('-'), 'expected soft hyphen to insert "-"');
});

test('LayoutEngine fallback glyph path uses getGlyphByChar with stable ids and kerning calls', () => {
  const kerningCalls = [];
  const fakeFont = {
    getGlyphIndexByChar: () => null,
    getGlyphByChar: (ch) => (ch === 'A' || ch === 'V' ? { advanceWidth: 500 } : null),
    getGlyph: () => null,
    getKerningValueByGlyphs: (left, right) => {
      kerningCalls.push([left, right]);
      return -50;
    }
  };
  const layout = LayoutEngine.layoutText(fakeFont, 'AV', {
    maxWidth: 2000,
    useKerning: true
  });
  assert.equal(layout.lines.length, 1);
  assert.deepEqual(layout.lines[0].glyphs.map((g) => g.char), ['A', 'V']);
  assert.deepEqual(layout.lines[0].glyphs.map((g) => g.glyphIndex), [0, 0]);
  assert.deepEqual(kerningCalls, [[0, 0]]);
  assert.equal(layout.lines[0].glyphs[1].advance, 450);
});

test('LayoutEngine explicitly preserves trailing newline as a final empty line', () => {
  const fakeFont = {
    getGlyphIndexByChar: (ch) => ch.charCodeAt(0),
    getGlyph: () => ({ advanceWidth: 500 }),
    getGlyphByChar: () => ({ advanceWidth: 500 })
  };
  const layout = LayoutEngine.layoutText(fakeFont, 'AB\n', { maxWidth: 2000 });
  assert.equal(layout.lines.length, 2);
  assert.deepEqual(layout.lines[0].glyphs.map((g) => g.char).join(''), 'AB');
  assert.equal(layout.lines[1].glyphs.length, 0);
});

test('LayoutEngine breakWords:false keeps an overwide token on a single overflowing line', () => {
  const fakeFont = {
    getGlyphIndexByChar: (ch) => ch.charCodeAt(0),
    getGlyph: () => ({ advanceWidth: 120 }),
    getGlyphByChar: () => ({ advanceWidth: 120 })
  };
  const layout = LayoutEngine.layoutText(fakeFont, 'OVERWIDE', {
    maxWidth: 200,
    breakWords: false
  });
  assert.equal(layout.lines.length, 1);
  assert.ok(layout.lines[0].width > 200);
});

test('LayoutEngine direction:rtl with bidi:none is deterministic for mixed runs', () => {
  const fakeFont = {
    getGlyphIndexByChar: (ch) => ch.codePointAt(0),
    getGlyph: () => ({ advanceWidth: 300 }),
    getGlyphByChar: () => ({ advanceWidth: 300 })
  };
  const text = 'ab אב 12';
  const a = LayoutEngine.layoutText(fakeFont, text, { direction: 'rtl', bidi: 'none', maxWidth: 3000 });
  const b = LayoutEngine.layoutText(fakeFont, text, { direction: 'rtl', bidi: 'none', maxWidth: 3000 });
  const charsA = a.lines[0].glyphs.map((g) => g.char).join('');
  const charsB = b.lines[0].glyphs.map((g) => g.char).join('');
  assert.equal(charsA, charsB);
  assert.equal(charsA, Array.from(text).reverse().join(''));
});

test('LayoutEngine soft hyphen with missing hyphenChar glyph preserves base letters', () => {
  const fakeFont = {
    getGlyphIndexByChar: (ch) => (/[A-Za-z]/.test(ch) ? ch.charCodeAt(0) : null),
    getGlyph: () => ({ advanceWidth: 180 }),
    getGlyphByChar: (ch) => (/[A-Za-z]/.test(ch) ? { advanceWidth: 180 } : null)
  };
  const layout = LayoutEngine.layoutText(fakeFont, 'hyphen\u00ADation', {
    maxWidth: 1000,
    breakWords: true,
    hyphenate: 'soft',
    hyphenChar: '*'
  });
  const rendered = layout.lines.flatMap((line) => line.glyphs.map((g) => g.char)).join('');
  assert.equal(rendered, 'hyphenation');
});

test('layoutStringAuto parity matches explicit layoutString for plain Latin text', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const text = 'Hello world AVATAR office';
  const auto = font.layoutStringAuto(text, { gpos: true });
  const explicit = font.layoutString(text, {
    gsubFeatures: ['liga'],
    scriptTags: ['latn', 'DFLT'],
    gpos: true
  });

  assert.equal(auto.length, explicit.length);
  assert.deepEqual(auto.map((g) => g.glyphIndex), explicit.map((g) => g.glyphIndex));
});

test('setVariationCoords tolerates fewer/more coords than axis count without NaN outlines', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/arimo/Arimo[wght].ttf')));
  const axes = font.getVariationAxes();
  if (!Array.isArray(axes) || axes.length === 0) return;

  const gid = font.getGlyphIndexByChar('H');
  assert.ok(gid != null);

  assert.doesNotThrow(() => font.setVariationCoords([]));
  assert.doesNotThrow(() => font.setVariationCoords([0, 0, 0, 0, 0]));

  const glyph = font.getGlyph(gid);
  assert.ok(glyph);
  for (let i = 0; i < glyph.getPointCount(); i++) {
    const p = glyph.getPoint(i);
    assert.equal(Number.isFinite(p.x), true);
    assert.equal(Number.isFinite(p.y), true);
  }
});

test('variation reset restores baseline metrics after axis extremes', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/arimo/Arimo[wght].ttf')));
  const axes = font.getVariationAxes();
  if (!Array.isArray(axes) || axes.length === 0) return;

  const gid = font.getGlyphIndexByChar('H');
  assert.ok(gid != null);
  const bbox = (glyph) => {
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
  };

  const defaults = Object.fromEntries(axes.map((a) => [a.name, a.defaultValue]));
  const mins = Object.fromEntries(axes.map((a) => [a.name, a.minValue]));
  const maxs = Object.fromEntries(axes.map((a) => [a.name, a.maxValue]));

  font.setVariationByAxes(defaults);
  const baseline = font.getGlyph(gid);
  assert.ok(baseline);
  const baselineAdvance = baseline.advanceWidth;
  const baselineBbox = bbox(baseline);

  font.setVariationByAxes(mins);
  font.setVariationByAxes(maxs);
  font.setVariationByAxes(defaults);

  const reset = font.getGlyph(gid);
  assert.ok(reset);
  assert.equal(reset.advanceWidth, baselineAdvance);
  assert.deepEqual(bbox(reset), baselineBbox);
});

test('getGlyphIndicesForStringWithGsub is stable with empty feature/script tag arrays', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const text = 'office';
  let first = null;
  let second = null;
  assert.doesNotThrow(() => {
    first = font.getGlyphIndicesForStringWithGsub(text, [], []);
    second = font.getGlyphIndicesForStringWithGsub(text, [], []);
  });
  assert.ok(Array.isArray(first));
  assert.deepEqual(first, second);
});

test('getKerningValue returns 0 for missing glyph pairs without noisy duplicate diagnostics', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const savedWarn = console.warn;
  const warns = [];
  console.warn = (...args) => warns.push(args.join(' '));
  try {
    const pair = ['\u{10348}', '\u{16A70}'];
    for (let i = 0; i < 10; i++) {
      assert.equal(font.getKerningValue(pair[0], pair[1]), 0);
    }
  } finally {
    console.warn = savedWarn;
  }
  assert.ok(warns.length <= 1);
});

test('GPOS mark positioning attaches combining marks (if fixture present)', () => {
  const candidates = [
    'truetypefonts/gpos/NotoSansArabic-Regular.ttf',
    'truetypefonts/gpos/NotoSansDevanagari-Regular.ttf',
    'truetypefonts/gpos/Amiri-Regular.ttf'
  ].map(p => path.resolve(__dirname, '..', p)).filter(p => fs.existsSync(p));

  if (candidates.length === 0) {
    // Fixture not present yet; skip without failing.
    return;
  }

  const sample = 'a\u0301'; // Latin + combining acute
  let sawOffset = false;

  for (const file of candidates) {
    const bytes = fs.readFileSync(file);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
    const layout = font.layoutString(sample, { gsubFeatures: ['liga'], gpos: true });
    if (layout.some(g => (g.xOffset ?? 0) !== 0 || (g.yOffset ?? 0) !== 0 || g.xAdvance === 0)) {
      sawOffset = true;
      break;
    }
  }

  assert.ok(sawOffset, 'expected GPOS to attach combining mark with offsets');
});

test('GPOS mark-to-ligature prefers the trailing ligature component for post-ligature marks', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  const subtable = Object.create(MarkLigPosFormat1.prototype);
  subtable.markCoverage = { findGlyph: (gid) => (gid === 22 ? 0 : -1) };
  subtable.markArray = {
    marks: [{ markClass: 0, anchor: { x: 5, y: 7 } }]
  };
  subtable.ligatureCoverage = { findGlyph: (gid) => (gid === 11 ? 0 : -1) };
  subtable.ligatureArray = {
    ligatures: [{
      components: [
        [{ x: 100, y: 200 }],
        [{ x: 300, y: 400 }]
      ]
    }]
  };

  font.gpos = {
    getSubtablesForFeatures: () => [subtable]
  };
  font.gdef = {
    getGlyphClass: (gid) => (gid === 22 ? 3 : 1)
  };

  const glyphIndices = [11, 22];
  const positioned = [
    { glyphIndex: 11, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 22, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  font.applyGposPositioning(glyphIndices, positioned, ['mark', 'mkmk'], ['DFLT']);

  assert.equal(positioned[1].xOffset, 295);
  assert.equal(positioned[1].yOffset, 393);
  assert.equal(positioned[1].xAdvance, 0);
});

test('GPOS prefers mark-to-mark attachment before mark-to-base fallback', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  const markBase = Object.create(MarkBasePosFormat1.prototype);
  markBase.markCoverage = { findGlyph: (gid) => (gid === 21 ? 0 : -1) };
  markBase.markArray = {
    marks: [{ markClass: 0, anchor: { x: 5, y: 7 } }]
  };
  markBase.baseCoverage = { findGlyph: (gid) => (gid === 10 ? 0 : -1) };
  markBase.baseArray = {
    baseRecords: [{ anchors: [{ x: 100, y: 100 }] }]
  };

  const markMark = Object.create(MarkMarkPosFormat1.prototype);
  markMark.mark1Coverage = { findGlyph: (gid) => (gid === 21 ? 0 : -1) };
  markMark.mark1Array = {
    marks: [{ markClass: 0, anchor: { x: 5, y: 7 } }]
  };
  markMark.mark2Coverage = { findGlyph: (gid) => (gid === 20 ? 0 : -1) };
  markMark.mark2Array = {
    records: [{ anchors: [{ x: 300, y: 400 }] }]
  };

  font.gpos = {
    getSubtablesForFeatures: () => [markBase, markMark]
  };
  font.gdef = {
    getGlyphClass: (gid) => (gid === 20 || gid === 21 ? 3 : 1)
  };

  const glyphIndices = [10, 20, 21];
  const positioned = [
    { glyphIndex: 10, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 20, xAdvance: 0, xOffset: 11, yOffset: 13, yAdvance: 0 },
    { glyphIndex: 21, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  font.applyGposPositioning(glyphIndices, positioned, ['mark', 'mkmk'], ['DFLT']);

  assert.equal(positioned[2].xOffset, 306);
  assert.equal(positioned[2].yOffset, 406);
  assert.equal(positioned[2].xAdvance, 0);
});

test('GPOS mark attachment inherits base offsets before applying anchor deltas', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  const markBase = Object.create(MarkBasePosFormat1.prototype);
  markBase.markCoverage = { findGlyph: (gid) => (gid === 21 ? 0 : -1) };
  markBase.markArray = {
    marks: [{ markClass: 0, anchor: { x: 5, y: 7 } }]
  };
  markBase.baseCoverage = { findGlyph: (gid) => (gid === 10 ? 0 : -1) };
  markBase.baseArray = {
    baseRecords: [{ anchors: [{ x: 100, y: 100 }] }]
  };

  font.gpos = { getSubtablesForFeatures: () => [markBase] };
  font.gdef = { getGlyphClass: (gid) => (gid === 21 ? 3 : 1) };

  const glyphIndices = [10, 21];
  const positioned = [
    { glyphIndex: 10, xAdvance: 600, xOffset: 30, yOffset: -20, yAdvance: 0 },
    { glyphIndex: 21, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  font.applyGposPositioning(glyphIndices, positioned, ['mark'], ['DFLT']);

  assert.equal(positioned[1].xOffset, 125);
  assert.equal(positioned[1].yOffset, 73);
  assert.equal(positioned[1].xAdvance, 0);
});

test('Arabic real-font GPOS applies stacked mark adjustments (Amiri fixture)', () => {
  const amiriPath = path.resolve(__dirname, '..', 'truetypefonts/gpos/amiri/Amiri-Regular.ttf');
  if (!fs.existsSync(amiriPath)) {
    return;
  }

  const bytes = fs.readFileSync(amiriPath);
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  const text = 'بَّ'; // base + shadda + fatha
  const gsubFeatures = ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'];
  const scriptTags = ['arab', 'DFLT'];
  const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
  const markIndices = glyphIndices
    .map((gid, i) => ({ gid, i }))
    .filter(({ gid }) => (font.gdef?.getGlyphClass?.(gid) ?? 0) === 3)
    .map(({ i }) => i);

  assert.ok(markIndices.length >= 2, 'expected at least two Arabic mark glyphs in stacked sample');

  const withoutGpos = font.layoutString(text, { gsubFeatures, scriptTags, gpos: false });
  const withGpos = font.layoutString(text, {
    gsubFeatures,
    scriptTags,
    gpos: true,
    gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
  });
  assert.equal(withGpos.length, withoutGpos.length);

  let adjustedMarks = 0;
  for (const i of markIndices) {
    const before = withoutGpos[i];
    const after = withGpos[i];
    if (!before || !after) continue;
    if (
      before.xOffset !== after.xOffset ||
      before.yOffset !== after.yOffset ||
      before.xAdvance !== after.xAdvance ||
      before.yAdvance !== after.yAdvance
    ) {
      adjustedMarks++;
    }
  }

  assert.ok(adjustedMarks >= 2, 'expected both stacked marks to receive GPOS adjustments');
});

test('Arabic real-font GPOS keeps stacked-mark behavior stable (Noto Naskh Arabic)', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoNaskhArabic-Regular.ttf')));
  const gsubFeatures = ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'];
  const scriptTags = ['arab', 'DFLT'];
  const samples = ['بِسْمِ', 'بَّ', 'شَّ', 'اللّٰه', 'قُرْآن'];

  let totalMarkAdjustments = 0;
  let sampleCountWithStacks = 0;

  for (const text of samples) {
    const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
    const markIndices = glyphIndices
      .map((gid, i) => ({ gid, i }))
      .filter(({ gid }) => (font.gdef?.getGlyphClass?.(gid) ?? 0) === 3)
      .map(({ i }) => i);

    if (markIndices.length >= 2) {
      sampleCountWithStacks++;
    }

    const withoutGpos = font.layoutString(text, { gsubFeatures, scriptTags, gpos: false });
    const withGpos = font.layoutString(text, {
      gsubFeatures,
      scriptTags,
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
    });
    assert.equal(withGpos.length, withoutGpos.length, `layout length mismatch for "${text}"`);

    let sampleMarkAdjustments = 0;
    for (const i of markIndices) {
      const before = withoutGpos[i];
      const after = withGpos[i];
      if (!before || !after) continue;
      if (
        before.xOffset !== after.xOffset ||
        before.yOffset !== after.yOffset ||
        before.xAdvance !== after.xAdvance ||
        before.yAdvance !== after.yAdvance
      ) {
        sampleMarkAdjustments++;
      }
    }

    if (markIndices.length > 0) {
      assert.ok(sampleMarkAdjustments > 0, `expected at least one Arabic mark adjustment for "${text}"`);
    }
    totalMarkAdjustments += sampleMarkAdjustments;
  }

  assert.ok(sampleCountWithStacks >= 3, 'expected multiple stacked-mark Arabic samples');
  assert.ok(totalMarkAdjustments >= 8, 'expected substantial Arabic mark adjustments across samples');
});

test('Devanagari complex clusters remain stable with GPOS enabled', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSansDevanagari-Regular.ttf')));
  const gsubFeatures = ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'];
  const scriptTags = ['deva', 'DFLT'];
  const samples = ['श्रृंखला', 'संस्कृत', 'किंचित', 'प्रार्थना शक्ति'];

  let sawMarkGlyph = false;
  for (const text of samples) {
    const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
    if (glyphIndices.some((gid) => (font.gdef?.getGlyphClass?.(gid) ?? 0) === 3)) {
      sawMarkGlyph = true;
    }

    const laidOut = font.layoutString(text, {
      gsubFeatures,
      scriptTags,
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    });

    assert.ok(laidOut.length > 0, `expected non-empty layout for "${text}"`);
    assert.ok(laidOut.length <= glyphIndices.length, `unexpected layout growth for "${text}"`);
    for (const g of laidOut) {
      assert.equal(Number.isFinite(g.xAdvance), true);
      assert.equal(Number.isFinite(g.yAdvance), true);
      assert.equal(Number.isFinite(g.xOffset), true);
      assert.equal(Number.isFinite(g.yOffset), true);
      const glyphClass = font.gdef?.getGlyphClass?.(g.glyphIndex) ?? 0;
      if (glyphClass === 3) {
        assert.equal(g.xAdvance, 0, `expected mark glyph xAdvance=0 in "${text}"`);
      }
    }
  }

  assert.equal(sawMarkGlyph, true, 'expected at least one Devanagari sample to include mark glyphs');
});

test('GPOS script validation sweep remains stable across available real-font fixtures', () => {
  const cases = [
    {
      font: 'truetypefonts/noto/NotoSansHebrew-Regular.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['hebr', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['שָׁלוֹם', 'בְּרָכָה', 'מִלָּה'],
      requireAdjustedMarks: true
    },
    {
      font: 'truetypefonts/noto/NotoSansThaiLooped-Regular.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['thai', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['ภาษาไทย', 'กำลัง', 'ผู้ใหญ่'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansKhmer-VF.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['khmr', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['ភាសាខ្មែរ', 'អក្សរ', 'កម្ពុជា'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansArabic-VF.ttf',
      gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
      scriptTags: ['arab', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs'],
      samples: ['بِسْمِ', 'السَّلَامُ', 'اللّٰه'],
      requireAdjustedMarks: true
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf',
      gsubFeatures: ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
      scriptTags: ['deva', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['श्रृंखला', 'संस्कृत', 'प्रार्थना'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansBengali-VF.ttf',
      gsubFeatures: ['locl', 'ccmp', 'nukt', 'akhn'],
      scriptTags: ['beng', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['বাংলা', 'কীর্তি', 'শ্রদ্ধা'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansMyanmar-VF.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['mymr', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['မြန်မာ', 'ကောင်းကင်', 'မြို့'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf',
      gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
      scriptTags: ['arab', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs'],
      samples: ['اردو', 'پاکستان', 'خوشی'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSansLao-VF.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['lao ', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['ພາສາລາວ', 'ສະບາຍດີ', 'ກຳລັງ'],
      requireAdjustedMarks: false
    },
    {
      font: 'truetypefonts/curated-extra/NotoSerifTibetan-VF.ttf',
      gsubFeatures: ['locl', 'ccmp'],
      scriptTags: ['tibt', 'DFLT'],
      gposFeatures: ['kern', 'mark', 'mkmk'],
      samples: ['བོད་ཡིག', 'བཀྲ་ཤིས', 'སྐད་ཡིག'],
      requireAdjustedMarks: false
    }
  ];

  let exercisedCases = 0;
  let exercisedSamples = 0;

  for (const cfg of cases) {
    const fullPath = path.resolve(__dirname, '..', cfg.font);
    if (!fs.existsSync(fullPath)) continue;
    exercisedCases++;
    let caseSawMarks = 0;
    let caseAdjustedMarkSamples = 0;

    const font = FontParser.fromArrayBuffer(toArrayBuffer(fs.readFileSync(fullPath)));
    for (const text of cfg.samples) {
      const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, cfg.gsubFeatures, cfg.scriptTags);
      const withGpos = font.layoutString(text, {
        gsubFeatures: cfg.gsubFeatures,
        scriptTags: cfg.scriptTags,
        gpos: true,
        gposFeatures: cfg.gposFeatures
      });
      const withoutGpos = font.layoutString(text, {
        gsubFeatures: cfg.gsubFeatures,
        scriptTags: cfg.scriptTags,
        gpos: false
      });

      assert.ok(withGpos.length > 0, `expected non-empty layout for "${text}" in ${cfg.font}`);
      assert.equal(withGpos.length, withoutGpos.length, `layout length mismatch for "${text}" in ${cfg.font}`);
      assert.ok(withGpos.length <= glyphIndices.length, `unexpected layout growth for "${text}" in ${cfg.font}`);

      let sawMark = false;
      let adjustedMark = false;
      for (let i = 0; i < withGpos.length; i++) {
        const g = withGpos[i];
        const before = withoutGpos[i];
        assert.equal(Number.isFinite(g.xAdvance), true);
        assert.equal(Number.isFinite(g.yAdvance), true);
        assert.equal(Number.isFinite(g.xOffset), true);
        assert.equal(Number.isFinite(g.yOffset), true);

        const glyphClass = font.gdef?.getGlyphClass?.(g.glyphIndex) ?? 0;
        if (glyphClass === 3) {
          sawMark = true;
          assert.equal(g.xAdvance, 0, `expected mark glyph xAdvance=0 for "${text}" in ${cfg.font}`);
          if (
            g.xOffset !== before.xOffset ||
            g.yOffset !== before.yOffset ||
            g.yAdvance !== before.yAdvance
          ) {
            adjustedMark = true;
          }
        }
      }

      if (sawMark) {
        caseSawMarks++;
        if (adjustedMark) caseAdjustedMarkSamples++;
      }
      exercisedSamples++;
    }

    if (cfg.requireAdjustedMarks && caseSawMarks > 0) {
      assert.ok(caseAdjustedMarkSamples > 0, `expected adjusted marks in ${cfg.font}`);
    }
  }

  assert.ok(exercisedCases >= 2, 'expected at least two script fixtures for validation sweep');
  assert.ok(exercisedSamples >= 6, 'expected multiple script samples in validation sweep');
});

test('Existing NotoSans fixture supports ligature + mark attachment path (fi + acute)', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const text = 'fi\u0301';
  const gsubFeatures = ['liga', 'rlig', 'ccmp', 'mark', 'mkmk'];
  const scriptTags = ['latn', 'DFLT'];

  const glyphIndices = font.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
  assert.ok(glyphIndices.length >= 2, 'expected at least ligature+mark glyphs');

  const classes = glyphIndices.map((gid) => font.gdef?.getGlyphClass?.(gid) ?? 0);
  assert.ok(classes.includes(2), 'expected a ligature class glyph');
  assert.ok(classes.includes(3), 'expected a mark class glyph');

  const laidOut = font.layoutString(text, {
    gsubFeatures,
    scriptTags,
    gpos: true,
    gposFeatures: ['kern', 'mark', 'mkmk']
  });
  assert.ok(laidOut.length >= 2, 'expected non-empty ligature+mark layout');

  const markEntry = laidOut.find((g) => (font.gdef?.getGlyphClass?.(g.glyphIndex) ?? 0) === 3);
  assert.ok(markEntry, 'expected mark glyph in layout result');
  assert.equal(markEntry.xAdvance, 0, 'mark glyph should not advance pen');
  assert.ok(
    markEntry.xOffset !== 0 || markEntry.yOffset !== 0,
    'expected mark anchor offset to be applied'
  );
});

test('Table access works for known tags on multiple font formats', () => {
  const ttfBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const woffBytes = readBytes('truetypefonts/ubuntu.woff');
  const ttf = FontParser.fromArrayBuffer(toArrayBuffer(ttfBytes));
  const woff = FontParser.fromArrayBuffer(toArrayBuffer(woffBytes));

  assert.ok(ttf.getTableByType(Table.cmap));
  assert.ok(ttf.getTableByType(Table.head));
  // Legacy sync WOFF parsing can be sparse depending on table layout.
  // Ensure method is callable and stable even when a table is absent.
  assert.ok(woff.getTableByType(Table.cmap) === null || typeof woff.getTableByType(Table.cmap) === 'object');
  assert.ok(woff.getTableByType(Table.head) === null || typeof woff.getTableByType(Table.head) === 'object');
});

test('WOFF2 helpers use injected decoder and fetch wrapper', async () => {
  const savedFetch = globalThis.fetch;
  const ttfBytes = new Uint8Array(readBytes('truetypefonts/noto/NotoSans-Regular.ttf'));
  try {
    setWoff2Decoder(() => ttfBytes);
    const fakeWoff2 = new Uint8Array([0x77, 0x4F, 0x46, 0x32, 0, 1, 2, 3]); // "wOF2"

    const parsed = FontParser.fromArrayBuffer(toArrayBuffer(fakeWoff2));
    assert.ok(parsed instanceof FontParserTTF);
    assert.ok(parsed.getGlyphIndexByChar('A') > 0);

    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => toArrayBuffer(fakeWoff2) });
    const viaLoad = await FontParserWOFF2.load('https://example.test/font.woff2');
    assert.ok(viaLoad instanceof FontParserTTF);

    globalThis.fetch = async () => ({ ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) });
    await assert.rejects(() => FontParserWOFF2.load('https://example.test/bad.woff2'), /HTTP error! Status: 500/);
  } finally {
    setWoff2Decoder(null);
    globalThis.fetch = savedFetch;
  }
});

test('FontParserWOFF.load fetch path handles success and decode failures', async () => {
  const savedFetch = globalThis.fetch;
  const woffBytes = readBytes('truetypefonts/ubuntu.woff');
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => toArrayBuffer(woffBytes) });
    try {
      const loaded = await FontParserWOFF.load('https://example.test/font.woff');
      assert.ok(loaded instanceof FontParserWOFF);
      assert.ok(Array.isArray(loaded.getFsTypeFlags()));
    } catch (err) {
      // Some runtimes may not expose DecompressionStream; treat as expected unhappy path.
      assert.match(String(err), /WOFF decompression requires DecompressionStream|Failed to create response body/i);
    }

    globalThis.fetch = async () => ({ ok: false, status: 403, arrayBuffer: async () => new ArrayBuffer(0) });
    await assert.rejects(() => FontParserWOFF.load('https://example.test/forbidden.woff'), /HTTP error! Status: 403/);
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('FontParserWOFF.load success path exposes core API surface', async () => {
  const savedFetch = globalThis.fetch;
  const woffBytes = readBytes('truetypefonts/ubuntu.woff');
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => toArrayBuffer(woffBytes) });
    let loaded = null;
    try {
      loaded = await FontParserWOFF.load('https://example.test/font.woff');
    } catch (err) {
      assert.match(String(err), /WOFF decompression requires DecompressionStream|Failed to create response body/i);
      return;
    }

    assert.ok(loaded instanceof FontParserWOFF);
    const meta = loaded.getMetadata();
    assert.ok(meta && typeof meta === 'object');
    assert.equal(typeof loaded.isItalic(), 'boolean');
    assert.equal(typeof loaded.isBold(), 'boolean');
    assert.equal(typeof loaded.isMonospace(), 'boolean');
    assert.ok(Array.isArray(loaded.getFsSelectionFlags()));
    assert.ok(Array.isArray(loaded.getFsTypeFlags()));

    const layout = loaded.layoutString('Hello', { gsubFeatures: ['liga'], gpos: true });
    assert.ok(Array.isArray(layout));
    assert.ok(loaded.getNumGlyphs() >= 0);
    assert.equal(loaded.getTableByType(0x12345678), null);
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('decodeWoff2 resolves via custom/global decoders and errors when unavailable', () => {
  const sample = new Uint8Array([1, 2, 3]);
  const savedGlobalWoff2 = globalThis.WOFF2;
  const savedGlobalWoff2Alt = globalThis.Woff2Decoder;
  try {
    setWoff2Decoder((bytes) => new Uint8Array(bytes.length));
    const viaCustom = decodeWoff2(sample);
    assert.equal(viaCustom.length, 3);

    setWoff2Decoder(null);
    globalThis.WOFF2 = { decode: (bytes) => new Uint8Array([bytes[0]]) };
    const viaGlobal = decodeWoff2(sample);
    assert.deepEqual(Array.from(viaGlobal), [1]);

    globalThis.WOFF2 = null;
    globalThis.Woff2Decoder = { decode: (bytes) => new Uint8Array([bytes[1]]) };
    const viaAltGlobal = decodeWoff2(sample);
    assert.deepEqual(Array.from(viaAltGlobal), [2]);

    globalThis.Woff2Decoder = null;
    assert.throws(() => decodeWoff2(sample), /WOFF2 decoder not available/);
  } finally {
    setWoff2Decoder(null);
    globalThis.WOFF2 = savedGlobalWoff2;
    globalThis.Woff2Decoder = savedGlobalWoff2Alt;
  }
});

test('Arabic and Devanagari GSUB shaping changes real-font glyph streams', () => {
  const arabic = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoNaskhArabic-Regular.ttf')));
  const devanagari = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSansDevanagari-Regular.ttf')));

  const arabicText = 'السلام عليكم';
  const arabicPlain = arabic.getGlyphIndicesForString(arabicText);
  const arabicShaped = arabic.getGlyphIndicesForStringWithGsub(
    arabicText,
    ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
    ['arab', 'DFLT']
  );
  assert.notDeepEqual(arabicShaped, arabicPlain, 'expected Arabic GSUB shaping to alter glyph sequence');
  assert.ok(arabicShaped.length > 0);

  const devaText = 'प्रार्थना शक्ति';
  const devaPlain = devanagari.getGlyphIndicesForString(devaText);
  const devaShaped = devanagari.getGlyphIndicesForStringWithGsub(
    devaText,
    ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
    ['deva', 'DFLT']
  );
  assert.notDeepEqual(devaShaped, devaPlain, 'expected Devanagari GSUB shaping to alter glyph sequence');
  assert.ok(devaShaped.length > 0);
});

test('GSUB/GPOS fall back to first language system when default is absent', () => {
  const langSysFallback = { id: 'fallback-langsys' };
  const fakeScript = {
    getDefaultLangSys: () => null,
    getFirstLangSys: () => langSysFallback
  };

  const selectedGsub = GsubTable.prototype.getDefaultLangSys.call({}, fakeScript);
  const selectedGpos = GposTable.prototype.getDefaultLangSys.call({}, fakeScript);
  assert.equal(selectedGsub, langSysFallback);
  assert.equal(selectedGpos, langSysFallback);
});

test('GSUB ignore flags respect mark filtering set and mark attachment type', () => {
  const lookup = {
    getFlag: () => 0x0010,
    getMarkFilteringSet: () => 2
  };
  const tableCtx = {
    gdef: {
      getGlyphClass: () => 3,
      isGlyphInMarkSet: (setIndex, glyphId) => setIndex === 2 && glyphId === 77,
      getMarkAttachmentClass: () => 0
    }
  };

  const inSet = GsubTable.prototype.isGlyphIgnored.call(tableCtx, lookup, 77);
  const outOfSet = GsubTable.prototype.isGlyphIgnored.call(tableCtx, lookup, 88);
  assert.equal(inSet, false, 'mark inside filtering set should not be ignored');
  assert.equal(outOfSet, true, 'mark outside filtering set should be ignored');

  const lookupAttach = {
    getFlag: () => 0x0200 // mark attachment type = 2
  };
  const attachCtx = {
    gdef: {
      getGlyphClass: () => 3,
      getMarkAttachmentClass: (glyphId) => (glyphId === 10 ? 2 : 1)
    }
  };
  assert.equal(
    GsubTable.prototype.isGlyphIgnored.call(attachCtx, lookupAttach, 10),
    false,
    'matching mark attachment class should not be ignored'
  );
  assert.equal(
    GsubTable.prototype.isGlyphIgnored.call(attachCtx, lookupAttach, 11),
    true,
    'non-matching mark attachment class should be ignored'
  );
});

test('GSUB mark filtering honors combined mark-set and attachment flags', () => {
  const lookup = {
    getFlag: () => 0x0010 | 0x0200,
    getMarkFilteringSet: () => 1
  };
  const ctx = {
    gdef: {
      getGlyphClass: () => 3,
      isGlyphInMarkSet: (setIndex, glyphId) => setIndex === 1 && glyphId !== 901,
      getMarkAttachmentClass: (glyphId) => (glyphId === 900 ? 2 : 1)
    }
  };

  assert.equal(GsubTable.prototype.isGlyphIgnored.call(ctx, lookup, 900), false);
  assert.equal(GsubTable.prototype.isGlyphIgnored.call(ctx, lookup, 901), true);
});

test('GPOS combines mark and cursive adjustments without duplicate application', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  const markBase = Object.create(MarkBasePosFormat1.prototype);
  markBase.markCoverage = { findGlyph: (gid) => (gid === 30 ? 0 : -1) };
  markBase.markArray = { marks: [{ markClass: 0, anchor: { x: 10, y: 20 } }] };
  markBase.baseCoverage = { findGlyph: (gid) => (gid === 20 ? 0 : -1) };
  markBase.baseArray = { baseRecords: [{ anchors: [{ x: 110, y: 220 }] }] };

  const cursive = Object.create(CursivePosFormat1.prototype);
  cursive.coverage = { findGlyph: (gid) => (gid === 20 ? 0 : gid === 30 ? 1 : -1) };
  cursive.entryExitRecords = [
    { entry: null, exit: { x: 500, y: 600 } },
    { entry: { x: 450, y: 550 }, exit: null }
  ];

  font.gpos = { getSubtablesForFeatures: () => [markBase, cursive] };
  font.gdef = { getGlyphClass: (gid) => (gid === 30 ? 3 : 1) };

  const glyphIndices = [20, 30];
  const positioned = [
    { glyphIndex: 20, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 30, xAdvance: 600, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  font.applyGposPositioning(glyphIndices, positioned, ['mark', 'mkmk', 'curs'], ['arab', 'DFLT']);
  assert.equal(positioned[1].xOffset, 150);
  assert.equal(positioned[1].yOffset, 250);
  assert.equal(positioned[1].xAdvance, 0);
});

test('LayoutEngine handles mixed whitespace controls and RTL without invalid geometry', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const text = 'A\tB\u00A0C\u00AD\nאבג  \n\tD';
  const layout = LayoutEngine.layoutText(font, text, {
    maxWidth: 300,
    align: 'justify',
    justifyLastLine: true,
    hyphenate: 'soft',
    preserveNbsp: true,
    collapseSpaces: false,
    direction: 'auto',
    tabSize: 3,
    breakWords: true
  });

  assert.ok(layout.lines.length >= 2);
  for (const line of layout.lines) {
    assert.equal(Number.isFinite(line.width), true);
    for (const g of line.glyphs) {
      assert.equal(Number.isFinite(g.x), true);
      assert.equal(Number.isFinite(g.y), true);
      assert.equal(Number.isFinite(g.advance), true);
    }
  }
});

test('LayoutEngine justify mode is stable for tiny widths and space-only lines', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const layout = LayoutEngine.layoutText(font, 'X\n   \nY', {
    maxWidth: 1,
    align: 'justify',
    justifyLastLine: true,
    collapseSpaces: false,
    breakWords: true
  });

  assert.ok(layout.lines.length >= 3);
  for (const line of layout.lines) {
    assert.equal(Number.isFinite(line.width), true);
    for (const g of line.glyphs) {
      assert.equal(Number.isFinite(g.x), true);
      assert.equal(Number.isFinite(g.advance), true);
    }
  }
});

test('LayoutEngine fallback tokenizer works when Intl.Segmenter is unavailable', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const savedSegmenter = globalThis.Intl?.Segmenter;
  try {
    if (globalThis.Intl) {
      globalThis.Intl.Segmenter = undefined;
    }
    const layout = LayoutEngine.layoutText(font, 'ab\tcd  ef\n\u00A0gh', {
      maxWidth: 120,
      collapseSpaces: false,
      preserveNbsp: true,
      breakWords: true,
      tabSize: 2
    });
    assert.ok(layout.lines.length >= 1);
    assert.equal(Number.isFinite(layout.width), true);
    assert.equal(Number.isFinite(layout.height), true);
  } finally {
    if (globalThis.Intl) {
      globalThis.Intl.Segmenter = savedSegmenter;
    }
  }
});

test('WOFF parser handles malformed table directory/header combinations safely', () => {
  const good = new Uint8Array(readBytes('truetypefonts/ubuntu.woff'));

  const badNumTables = new Uint8Array(good);
  badNumTables[12] = 0xff;
  badNumTables[13] = 0xff;
  assert.doesNotThrow(() => {
    try {
      const parsed = FontParser.fromArrayBuffer(toArrayBuffer(badNumTables));
      assert.ok(parsed);
      assert.equal(parsed.getTableByType(0x12345678), null);
    } catch (err) {
      assert.match(String(err), /offset|range|bounds|invalid|table|WOFF/i);
    }
  });

  const badLength = new Uint8Array(good);
  badLength[8] = 0x00;
  badLength[9] = 0x00;
  badLength[10] = 0x00;
  badLength[11] = 0x20;
  assert.doesNotThrow(() => {
    try {
      const parsed = FontParser.fromArrayBuffer(toArrayBuffer(badLength));
      assert.ok(parsed);
      assert.equal(parsed.getTableByType(0x12345678), null);
    } catch (err) {
      assert.match(String(err), /offset|range|bounds|invalid|WOFF/i);
    }
  });
});

test('FontParserWOFF.decodeWoffToSfnt rejects out-of-bounds table offset + compLength', async () => {
  const decodeWoffToSfnt = FontParserWOFF.decodeWoffToSfnt.bind(FontParserWOFF);
  const malformed = new ArrayBuffer(64);
  const view = new DataView(malformed);
  view.setUint32(0, 0x774f4646, false); // wOFF
  view.setUint32(4, 0x00010000, false);
  view.setUint32(8, 64, false);
  view.setUint16(12, 1, false);
  view.setUint32(16, 64, false);
  view.setUint32(44, 0x68656164, false); // head
  view.setUint32(48, 60, false); // offset
  view.setUint32(52, 20, false); // compLength (overruns 64-byte buffer)
  view.setUint32(56, 20, false); // origLength
  view.setUint32(60, 0, false); // checksum
  await assert.rejects(() => decodeWoffToSfnt(malformed), /offset|bounds|length|range|invalid/i);
});

test('FontParserWOFF.decodeWoffToSfnt throws when decompressed bytes are shorter than origLength', async () => {
  const decodeWoffToSfnt = FontParserWOFF.decodeWoffToSfnt.bind(FontParserWOFF);
  const malformed = buildMinimalWoff({
    numTables: 1,
    totalSfntSize: 64,
    length: 64,
    entryOffset: 60,
    compLength: 2,
    origLength: 12
  });

  const savedInflate = FontParserWOFF.inflate;
  FontParserWOFF.inflate = async () => new Uint8Array([1, 2, 3]);
  try {
    await assert.rejects(() => decodeWoffToSfnt(malformed), /short|origLength|decompress|length|invalid/i);
  } finally {
    FontParserWOFF.inflate = savedInflate;
  }
});

test('FontParserWOFF.decodeWoffToSfnt rejects numTables=0 malformed header', async () => {
  const decodeWoffToSfnt = FontParserWOFF.decodeWoffToSfnt.bind(FontParserWOFF);
  const malformed = buildMinimalWoff({
    numTables: 0,
    totalSfntSize: 12,
    length: 44
  });
  await assert.rejects(() => decodeWoffToSfnt(malformed), /numTables|invalid|header/i);
});

test('FontParserWOFF.load rejects fetch body and decode failures consistently', async () => {
  const savedFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => { throw new Error('boom-body'); } });
    await assert.rejects(() => FontParserWOFF.load('https://example.test/body-fail.woff'), /boom-body/i);

    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => ({ not: 'arraybuffer' }) });
    await assert.rejects(
      () => FontParserWOFF.load('https://example.test/not-buffer.woff'),
      /arraybuffer|offset|bounds|invalid|decompression|Failed/i
    );
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('COLR v1 layer flattening tolerates unknown and nested paint formats', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  font.cpal = {
    getPalette: () => [{ red: 10, green: 20, blue: 30, alpha: 255 }]
  };
  font.colr = {
    version: 1,
    getPaintForGlyph: (glyphId) => {
      if (glyphId === 1) return { format: 99 };
      if (glyphId === 2) return { format: 1, layers: [{ format: 10, glyphID: 2, paint: { format: 2, paletteIndex: 0, alpha: 0.5 } }] };
      return null;
    }
  };

  assert.deepEqual(font.getColrV1LayersForGlyph(1), []);
  const nested = font.getColrV1LayersForGlyph(2);
  assert.equal(nested.length, 1);
  assert.equal(nested[0].glyphId, 2);
  assert.equal(typeof nested[0].color, 'string');
});

test('COLRv1 layer flattening keeps stable fallback colors for invalid palette indexes', () => {
  const parser = createTtfParserMock();
  parser.cpal = {
    getPalette: () => [{ red: 10, green: 20, blue: 30, alpha: 255 }]
  };
  parser.colr = {
    version: 1,
    getPaintForGlyph: () => ({
      format: 1,
      layers: [
        { format: 10, glyphID: 11, paint: { format: 2, paletteIndex: 0, alpha: 1 } },
        { format: 10, glyphID: 12, paint: { format: 2, paletteIndex: 9, alpha: 1 } },
        { format: 10, glyphID: 13, paint: { format: 2, paletteIndex: 999, alpha: 1 } }
      ]
    })
  };
  const layers = parser.getColrV1LayersForGlyph(1, 0);
  assert.deepEqual(layers, [
    { glyphId: 11, color: 'rgba(10, 20, 30, 1)', paletteIndex: 0 },
    { glyphId: 12, color: null, paletteIndex: 9 },
    { glyphId: 13, color: null, paletteIndex: 999 }
  ]);
});

test('SVG glyph document API remains stable on null and thrown provider responses', async () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  font.svg = {
    getSvgDocumentForGlyphAsync: async (gid) => {
      if (gid === 10) return { svgText: null, isCompressed: false };
      throw new Error('corrupt-svg');
    }
  };

  const nullResult = await font.getSvgDocumentForGlyphAsync(10);
  assert.deepEqual(nullResult, { svgText: null, isCompressed: false });
  await assert.rejects(() => font.getSvgDocumentForGlyphAsync(11), /corrupt-svg/);
});

test('SVG table invalid gzip payload is handled as controlled failure', async () => {
  const table = Object.create(SvgTable.prototype);
  table.startOffset = 0;
  table.svgDocIndexOffset = 0;
  table.entries = [{ startGlyphId: 1, endGlyphId: 1, svgDocOffset: 0, svgDocLength: 8 }];
  table.view = new DataView(Uint8Array.from([0x1f, 0x8b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]).buffer);

  const savedDecompressionStream = globalThis.DecompressionStream;
  globalThis.DecompressionStream = class {
    constructor() {}
  };
  try {
    await assert.rejects(() => table.getSvgDocumentForGlyphAsync(1), /invalid|gzip|stream|decompress|TypeError|Error/i);
  } finally {
    globalThis.DecompressionStream = savedDecompressionStream;
  }
});

test('CFF2 variable outlines stay stable under multi-axis sweeps', () => {
  const candidates = [
    'truetypefonts/curated/SourceSerif4Variable-Roman.otf',
    'truetypefonts/curated/SourceSerif4Variable-Italic.otf'
  ];
  for (const file of candidates) {
    const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes(file)));
    const axes = font.getVariationAxes?.() ?? [];
    if (axes.length === 0) continue;
    const settings = {};
    for (const axis of axes) {
      settings[axis.tag] = axis.defaultValue;
    }
    for (const axis of axes) {
      settings[axis.tag] = axis.minValue;
      font.setVariationByAxes(settings);
      assert.ok(font.getGlyph(0));
      settings[axis.tag] = axis.maxValue;
      font.setVariationByAxes(settings);
      assert.ok(font.getGlyph(0));
    }
  }
});

test('PairPos subtables do not apply adjustments for non-matching class pairs', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  assert.ok(font instanceof FontParserTTF);

  const pair = Object.create(PairPosSubtable.prototype);
  pair.getPairValue = (left, right) => (left === 10 && right === 11 ? { v1: { xAdvance: -20 }, v2: { xPlacement: 5 } } : null);
  font.gpos = { getSubtablesForFeatures: () => [pair] };
  font.gdef = { getGlyphClass: () => 1 };

  const glyphIndices = [10, 12, 11];
  const positioned = [
    { glyphIndex: 10, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 12, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 11, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ];

  font.applyGposPositioning(glyphIndices, positioned, ['kern'], ['latn', 'DFLT']);
  assert.deepEqual(positioned, [
    { glyphIndex: 10, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 12, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 },
    { glyphIndex: 11, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 }
  ]);
});

test('WOFF metadata/style helpers cover fallback and flagged branches', () => {
  const woff = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/ubuntu.woff')));
  assert.ok(woff instanceof FontParserWOFF);

  const savedName = woff.pName;
  const savedOs2 = woff.os2;
  const savedPost = woff.post;
  try {
    const nameRecords = [
      { nameId: 2, record: 'Italic', platformId: 1, encodingId: 0, languageId: 0 },
      { nameId: 2, record: 'Bold', platformId: 3, encodingId: 1, languageId: 0x0409 },
      { nameId: 1, record: 'Family', platformId: 3, encodingId: 1, languageId: 0x0409 }
    ];
    woff.pName = {
      getRecord: (nameId) => (nameRecords.find(r => r.nameId === nameId)?.record ?? ''),
      records: nameRecords
    };
    woff.os2 = {
      version: 5,
      usWeightClass: 750,
      usWidthClass: 5,
      fsType: 0x0002 | 0x0100,
      fsSelection: 0x0001 | 0x0020 | 0x0200,
      sTypoAscender: 1,
      sTypoDescender: -1,
      sTypoLineGap: 0,
      usWinAscent: 2,
      usWinDescent: 1,
      usFirstCharIndex: 32,
      usLastCharIndex: 126,
      achVendorID: 0x41424344,
      ulUnicodeRange1: 1,
      ulUnicodeRange2: 2,
      ulUnicodeRange3: 3,
      ulUnicodeRange4: 4,
      ulCodePageRange1: 5,
      ulCodePageRange2: 6,
      sxHeight: 7,
      sCapHeight: 8,
      usDefaultChar: 9,
      usBreakChar: 10,
      usMaxContext: 11,
      usLowerOpticalPointSize: 12,
      usUpperOpticalPointSize: 13,
      panose: null
    };
    woff.post = {
      version: 0x00030000,
      italicAngle: 0x00010000,
      underlinePosition: -10,
      underlineThickness: 20,
      isFixedPitch: 1
    };

    assert.equal(woff.isBold(), true);
    assert.equal(woff.isItalic(), true);
    assert.equal(woff.isMonospace(), true);
    assert.ok(woff.getFsTypeFlags().includes('restricted-license-embedding'));
    assert.ok(woff.getFsSelectionFlags().includes('bold'));
    assert.equal(woff.getOs2Metrics()?.vendorId, 'ABCD');
    assert.equal(woff.getPostMetrics()?.isFixedPitch, true);
    assert.equal(woff.getNameInfo().family, 'Family');

    woff.os2 = null;
    woff.post = null;
    woff.pName = null;
    assert.deepEqual(woff.getAllNameRecordsDetailed(), []);
    assert.equal(woff.getOs2Metrics(), null);
    assert.equal(woff.getPostMetrics(), null);
    assert.equal(woff.getWeightClass(), 0);
    assert.deepEqual(woff.getFsTypeFlags(), ['installable-embedding']);
    assert.equal(woff.isBold(), false);
    assert.equal(woff.isItalic(), false);
  } finally {
    woff.pName = savedName;
    woff.os2 = savedOs2;
    woff.post = savedPost;
  }
});

test('GsubTable lookup application covers applyAt substitute and ligature fallback branches', () => {
  const ligatureSubtable = Object.create(LigatureSubstFormat1.prototype);
  ligatureSubtable.tryLigature = (glyphs, index) => (glyphs[index] === 7 ? { glyphId: 99, length: 2 } : null);

  const gsub = {
    gdef: null,
    lookupList: {
      getLookups: () => [{
        getSubtableCount: () => 3,
        getSubtable: (i) => {
          if (i === 0) return { applyAt: (glyphs, index) => (index === 0 ? [42, ...glyphs.slice(1)] : null) };
          if (i === 1) return { substitute: (gid) => (gid === 5 ? 6 : gid) };
          if (i === 2) return ligatureSubtable;
          return null;
        },
        getFlag: () => 0
      }]
    },
    isGlyphIgnored: () => false
  };

  const outApplyAt = GsubTable.prototype.applyLookupAt.call(gsub, 0, [5, 7, 8], 0);
  assert.deepEqual(outApplyAt, [42, 7, 8]);

  const outSubstitute = GsubTable.prototype.applyLookupAt.call(gsub, 0, [5, 1], 1);
  assert.deepEqual(outSubstitute, [5, 1]);

  const outLigature = GsubTable.prototype.applyLookup.call(gsub, 0, [7, 8, 1]);
  assert.deepEqual(outLigature, [99, 1]);
});

test('LayoutEngine uses non-simple RTL branch when bidi mode is not simple', () => {
  const font = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSansHebrew-Regular.ttf')));
  const layout = LayoutEngine.layoutText(font, 'אבג דה', {
    direction: 'rtl',
    bidi: 'full',
    maxWidth: 300,
    align: 'left'
  });
  assert.ok(layout.lines.length >= 1);
  for (const line of layout.lines) {
    assert.equal(Number.isFinite(line.width), true);
  }
});

test('GsubTable applyFeatures honors required feature ordering and optional tag filtering', () => {
  const tag = (s) => (
    (s.charCodeAt(0) << 24) |
    (s.charCodeAt(1) << 16) |
    (s.charCodeAt(2) << 8) |
    s.charCodeAt(3)
  ) >>> 0;

  const gsub = Object.create(GsubTable.prototype);
  gsub.findPreferredScript = () => ({});
  gsub.getDefaultLangSys = () => ({
    getRequiredFeatureIndex: () => 2,
    getFeatureIndices: () => [0, 2, 1]
  });
  gsub.featureList = {
    getFeatureRecords: () => [
      { getTag: () => tag('liga') },
      { getTag: () => tag('calt') },
      { getTag: () => tag('rlig') }
    ],
    features: [
      { getLookupCount: () => 1, getLookupListIndex: () => 10 },
      { getLookupCount: () => 1, getLookupListIndex: () => 11 },
      { getLookupCount: () => 1, getLookupListIndex: () => 12 }
    ]
  };
  gsub.lookupList = {};
  const called = [];
  gsub.applyLookup = (lookupIndex, glyphs) => {
    called.push(lookupIndex);
    return glyphs.concat(lookupIndex);
  };

  const out = GsubTable.prototype.applyFeatures.call(gsub, [1, 2], ['liga'], ['DFLT']);
  assert.deepEqual(called, [12, 10]);
  assert.deepEqual(out, [1, 2, 12, 10]);
});

test('GsubTable applyLookup covers context/apply/substitute branches', () => {
  const gsub = Object.create(GsubTable.prototype);
  gsub.gdef = {};
  gsub.lookupList = {
    getLookups: () => [{
      getSubtableCount: () => 4,
      getSubtable: (i) => {
        if (i === 0) return {
          applyToGlyphsWithContext: (glyphs) => glyphs.concat(50)
        };
        if (i === 1) return {
          applyToGlyphs: (glyphs) => glyphs.map(g => g + 1)
        };
        if (i === 2) return {
          substitute: (g) => (g === 2 ? 0 : null)
        };
        if (i === 3) return {
          substitute: (g) => (g === 3 ? 9 : g)
        };
        return null;
      },
      getFlag: () => 0,
      getMarkFilteringSet: () => null
    }]
  };

  const out = GsubTable.prototype.applyLookup.call(gsub, 0, [1, 2]);
  assert.deepEqual(out, [2, 9, 51]);
});

test('GsubTable helper branches cover ignore flags and missing gdef behavior', () => {
  const noGdef = { gdef: null };
  assert.equal(GsubTable.prototype.isGlyphIgnored.call(noGdef, { getFlag: () => 0x0008 }, 10), false);

  assert.equal(GsubTable.prototype.hasIgnoreFlags.call({}, { getFlag: () => 0x0000 }), false);
  assert.equal(GsubTable.prototype.hasIgnoreFlags.call({}, { getFlag: () => 0x0002 }), true);
});

test('WOFF cmap helper methods cover preferred and fallback selection branches', () => {
  const woff = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/ubuntu.woff')));
  assert.ok(woff instanceof FontParserWOFF);
  const savedCmap = woff.cmap;
  try {
    const fmt4 = { getFormatType: () => 4 };
    const fmt12 = { getFormatType: () => 12 };
    const fmt0 = { format: 0 };

    woff.cmap = {
      formats: [fmt0, fmt12],
      getCmapFormats: (platformId, encodingId) => (platformId === 3 && encodingId === 10 ? [fmt12] : [])
    };
    assert.equal(woff.getBestCmapFormatFor(0x10000), fmt12);

    woff.cmap = {
      formats: [fmt0, fmt4],
      getCmapFormats: () => []
    };
    assert.equal(woff.getBestCmapFormatFor(65), fmt4);

    woff.cmap = {
      formats: [],
      getCmapFormats: () => []
    };
    assert.equal(woff.getBestCmapFormatFor(65), null);
    assert.equal(woff.pickBestFormat([]), null);
  } finally {
    woff.cmap = savedCmap;
  }
});

test('GlyphData accessors and scaling branches remain stable', () => {
  const emptyDesc = {
    getPointCount: () => 0,
    getEndPtOfContours: () => -1,
    getXCoordinate: () => 0,
    getYCoordinate: () => 0,
    getFlags: () => 0
  };
  const empty = new GlyphData(emptyDesc, 0, 100, { includePhantoms: false });
  assert.equal(empty.getPointCount(), 0);
  assert.equal(empty.getPoint(0), undefined);
  assert.doesNotThrow(() => empty.scale(64));
  assert.doesNotThrow(() => empty.reset());

  const simpleDesc = {
    getPointCount: () => 2,
    getEndPtOfContours: (i) => (i === 0 ? 1 : 1),
    getXCoordinate: (i) => (i === 0 ? 64 : 128),
    getYCoordinate: (i) => (i === 0 ? 32 : 64),
    getFlags: () => 0x01
  };
  const glyph = new GlyphData(simpleDesc, 64, 256);
  const before = glyph.getPoint(0);
  assert.ok(before);
  glyph.scale(64);
  const after = glyph.getPoint(0);
  assert.ok(after);
  assert.equal(glyph.getPointCount() >= 2, true);
});

test('SVGFont path export covers contour branch variations', () => {
  const fakeGlyph = {
    getPointCount: () => 4,
    getPoint: (i) => [
      { x: 0, y: 0, onCurve: true, endOfContour: false },
      { x: 10, y: 20, onCurve: false, endOfContour: false },
      { x: 20, y: 0, onCurve: true, endOfContour: false },
      { x: 0, y: 0, onCurve: true, endOfContour: true }
    ][i]
  };
  const d = SVGFont.glyphToPath(fakeGlyph, 1, 0, 0);
  assert.ok(d.includes('M '));
  assert.ok(d.includes('Q ') || d.includes('L '));

  const sparseGlyph = {
    getPointCount: () => 2,
    getPoint: (i) => [null, { x: 0, y: 0, onCurve: true, endOfContour: true }][i]
  };
  assert.equal(SVGFont.glyphToPath(sparseGlyph, 1, 0, 0), '');

  const fakeFont = {
    getGlyphByChar: (ch) => (ch === 'A' ? fakeGlyph : null),
    getAscent: () => 800,
    getDescent: () => -200,
    getTableByType: () => ({ unitsPerEm: 1000 })
  };
  const svg = SVGFont.exportStringSvg(fakeFont, 'AB', { letterSpacing: 10 });
  assert.ok(svg.includes('<svg'));
  const summary = SVGFont.exportFontSummarySvg(fakeFont, {});
  assert.ok(summary.includes('<svg'));
  assert.ok(summary.includes('<path'));
});

test('AlternateSubstFormat1 supports substitute/applyAt/applyToGlyphs branches', () => {
  const st = Object.create(AlternateSubstFormat1.prototype);
  st.coverage = { findGlyph: (gid) => (gid === 10 ? 0 : -1) };
  st.alternates = [[77], []];

  assert.equal(st.substitute(10), 77);
  assert.equal(st.substitute(11), null);
  assert.deepEqual(st.applyAt([10, 20], 0), [77, 20]);
  assert.equal(st.applyAt([11, 20], 0), null);
  assert.deepEqual(st.applyToGlyphs([10, 11]), [77, 11]);
});

test('MultipleSubstFormat1 supports substitute/applyAt/applyToGlyphs branches', () => {
  const st = Object.create(MultipleSubstFormat1.prototype);
  st.coverage = { findGlyph: (gid) => (gid === 5 ? 0 : -1) };
  st.sequences = [[8, 9]];

  assert.equal(st.substitute(5), 8);
  assert.equal(st.substitute(6), null);
  assert.deepEqual(st.applyAt([5, 6], 0), [8, 9, 6]);
  assert.equal(st.applyAt([6, 5], 0), null);
  assert.deepEqual(st.applyToGlyphs([6, 5]), [6, 8, 9]);
});

test('ContextSubstFormat1/2/3 applyToGlyphsWithContext paths execute', () => {
  const gsub = {
    applyLookupAt: (lookupIndex, glyphs, index) => {
      const out = glyphs.slice();
      out[index] = out[index] + lookupIndex;
      return out;
    }
  };

  const f1 = Object.create(ContextSubstFormat1.prototype);
  f1.gsub = gsub;
  f1.coverage = { findGlyph: (gid) => (gid === 1 ? 0 : -1) };
  f1.ruleSets = [[{ input: [2], records: [{ sequenceIndex: 1, lookupListIndex: 10 }] }]];
  assert.deepEqual(f1.applyToGlyphsWithContext([1, 2, 3]), [1, 12, 3]);

  const f2 = Object.create(ContextSubstFormat2.prototype);
  f2.gsub = gsub;
  f2.coverage = { findGlyph: (gid) => (gid === 1 ? 0 : -1) };
  f2.classDef = { getGlyphClass: (gid) => (gid === 1 ? 1 : gid === 2 ? 2 : 0) };
  f2.classSets = [[], [{ inputClasses: [2], records: [{ sequenceIndex: 1, lookupListIndex: 5 }] }]];
  assert.deepEqual(f2.applyToGlyphsWithContext([1, 2, 3]), [1, 7, 3]);

  const f3 = Object.create(ContextSubstFormat3.prototype);
  f3.gsub = gsub;
  f3.glyphCount = 2;
  f3.coverages = [
    { findGlyph: (gid) => (gid === 1 ? 0 : -1) },
    { findGlyph: (gid) => (gid === 2 ? 0 : -1) }
  ];
  f3.records = [{ sequenceIndex: 1, lookupListIndex: 3 }];
  assert.deepEqual(f3.applyToGlyphsWithContext([1, 2, 3]), [1, 5, 3]);
});

test('SinglePosFormat1 getAdjustment returns value for covered glyph only', () => {
  const st = Object.create(SinglePosFormat1.prototype);
  st.coverage = { findGlyph: (gid) => (gid === 25 ? 0 : -1) };
  st.value = { xAdvance: -20 };
  assert.deepEqual(st.getAdjustment(25), { xAdvance: -20 });
  assert.equal(st.getAdjustment(26), null);
});

test('ColrTable helper methods cover paint, clip, and variation branches', () => {
  const table = Object.create(ColrTable.prototype);
  const view = new DataView(new ArrayBuffer(512));
  table.view = view;
  table.baseGlyphRecords = [{ glyphId: 10, firstLayerIndex: 0, numLayers: 2 }];
  table.layerRecords = [{ glyphId: 20, paletteIndex: 1 }, { glyphId: 30, paletteIndex: 2 }];
  table.layerPaintOffsets = [80, 80];
  table.baseGlyphPaintRecords = [{ glyphId: 40, paintOffset: 60 }];
  table.baseGlyphListStart = 0;
  table.variationCoords = [0.5];
  table.clipBoxes = new Map([[40, { xMin: 1, yMin: 2, xMax: 3, yMax: 4 }]]);
  table.varStore = {
    start: 0,
    dataOffsets: [200],
    regions: [[{ start: 0, peak: 1, end: 1 }]]
  };

  view.setUint8(0, 0x12);
  view.setUint8(1, 0x34);
  view.setUint8(2, 0x56);
  view.setInt32(4, 0x00018000, false);
  view.setInt16(8, 0x2000, false);
  view.setInt32(20, 0x00010000, false);
  view.setInt32(24, 0x00000000, false);
  view.setInt32(28, 0x00000000, false);
  view.setInt32(32, 0x00010000, false);
  view.setInt32(36, 0x00000000, false);
  view.setInt32(40, 0x00000000, false);
  const setOffset24 = (offset, value) => {
    view.setUint8(offset, (value >>> 16) & 0xff);
    view.setUint8(offset + 1, (value >>> 8) & 0xff);
    view.setUint8(offset + 2, value & 0xff);
  };
  view.setUint8(60, 2); // paint solid
  view.setUint16(61, 4, false);
  view.setInt16(63, 0x2000, false);
  view.setUint8(70, 3); // paint var solid
  view.setUint16(71, 5, false);
  view.setInt16(73, 0x2000, false);
  view.setUint32(75, 0, false);
  view.setUint8(80, 2); // shared nested solid
  view.setUint16(81, 7, false);
  view.setInt16(83, 0x2000, false);
  view.setUint8(90, 10); // paint glyph
  setOffset24(91, 10);
  view.setUint16(94, 88, false);
  view.setUint8(100, 1); // paint layers
  view.setUint8(101, 2);
  view.setUint32(102, 0, false);
  view.setUint8(110, 0xff); // unknown format
  view.setUint16(120, 1, false); // clip box format 1
  view.setInt16(122, -10, false);
  view.setInt16(124, -20, false);
  view.setInt16(126, 30, false);
  view.setInt16(128, 40, false);

  // Variation data record at offset 200.
  view.setUint16(200, 1, false); // itemCount
  view.setUint16(202, 1, false); // shortDeltaCount
  view.setUint16(204, 1, false); // regionIndexCount
  view.setUint16(206, 0, false); // region index 0
  view.setInt16(208, 200, false); // delta value

  assert.deepEqual(table.getLayersForGlyph(10), table.layerRecords);
  assert.deepEqual(table.getLayersForGlyph(11), []);
  assert.equal(table.getType(), Table.COLR);
  const coords = [0.25, -0.5];
  table.setVariationCoords(coords);
  coords[0] = 1;
  assert.deepEqual(table.variationCoords, [0.25, -0.5]);
  assert.deepEqual(table.getClipForGlyph(40), { xMin: 1, yMin: 2, xMax: 3, yMax: 4 });
  assert.equal(table.getClipForGlyph(41), null);
  assert.equal(table.readOffset24(0), 0x123456);
  assert.equal(table.readFixed16_16(4), 1.5);
  assert.equal(table.readF2Dot14(8), 0.5);
  assert.deepEqual(table.readAffine2x3(20), { xx: 1, yx: 0, xy: 0, yy: 1, dx: 0, dy: 0 });

  const solid = table.readPaint(60, 60, 0);
  assert.equal(solid.format, 2);
  assert.equal(solid.paletteIndex, 4);
  assert.equal(solid.alpha, 0.5);

  const varSolid = table.readPaint(70, 70, 0);
  assert.equal(varSolid.format, 3);
  assert.equal(varSolid.paletteIndex, 5);
  assert.equal(varSolid.alpha, 50.5);

  const glyphPaint = table.readPaint(90, 90, 0);
  assert.equal(glyphPaint.format, 10);
  assert.equal(glyphPaint.glyphID, 88);
  assert.equal(glyphPaint.paint.format, 1);

  const layersPaint = table.readPaint(100, 100, 0);
  assert.equal(layersPaint.format, 1);
  assert.equal(layersPaint.layers.length, 2);

  // Cover additional non-recursive paint branches safely.
  table.readColorLine = () => ({ extend: 0, stops: [] });
  view.setUint8(240, 4);
  setOffset24(241, 0);
  assert.equal(table.readPaint(240, 240, 0).format, 4);
  view.setUint8(248, 11);
  view.setUint16(249, 123, false);
  assert.equal(table.readPaint(248, 248, 0).glyphID, 123);

  assert.deepEqual(table.getPaintForGlyph(40), { format: 2, paletteIndex: 4, alpha: 0.5 });
  assert.equal(table.getPaintForGlyph(41), null);
  assert.equal(table.readPaint(-1, 0, 0), null);
  assert.equal(table.readPaint(9999, 0, 0), null);
  assert.equal(table.readPaint(60, 60, 65), null);
  assert.deepEqual(table.readPaint(110, 110, 0), { format: 0xff });

  assert.equal(table.getVarDelta(0), 50);
  assert.deepEqual(table.getVarDeltas(0, 3), [50, 0, 0]);
  assert.equal(table.getVarDelta(0x00010000), 0);
  assert.equal(table.readClipBox(120).xMin, -10);
  assert.equal(table.readClipBox(10), null);
});

test('ColrTable reads variation store and clip-list fallback formats', () => {
  const table = Object.create(ColrTable.prototype);
  const bytes = new Uint8Array(256);
  const view = new DataView(bytes.buffer);
  table.view = view;
  table.clipBoxes = new Map();
  table.varStore = null;
  table.variationCoords = [1];

  // VariationStore @ 0
  view.setUint16(0, 1, false); // format
  view.setUint32(2, 16, false); // region list offset
  view.setUint16(6, 1, false); // dataCount
  view.setUint32(8, 64, false); // dataOffset[0]
  // Region list @ 16
  view.setUint16(16, 1, false); // axisCount
  view.setUint16(18, 1, false); // regionCount
  view.setInt16(20, 0, false); // start
  view.setInt16(22, 0x4000, false); // peak = 1
  view.setInt16(24, 0x4000, false); // end = 1
  // ItemVariationData @ 64
  view.setUint16(64, 1, false); // itemCount
  view.setUint16(66, 1, false); // shortDeltaCount
  view.setUint16(68, 1, false); // regionIndexCount
  view.setUint16(70, 0, false); // region index
  view.setInt16(72, 50, false); // delta

  const byteArray = new ByteArray(bytes);
  byteArray.seek(10);
  table.readVariationStore(byteArray, 0);
  assert.equal(byteArray.offset, 10);
  assert.equal(table.varStore.axisCount, 1);
  assert.equal(table.getVarDelta(0), 50);

  // ClipList @ 100 using one-byte fallback format and ClipBoxVar.
  view.setUint16(100, 0, false); // invalid u16 format to trigger fallback read
  view.setUint8(102, 2); // fallback format byte
  view.setUint16(103, 1, false); // clipCount
  view.setUint16(105, 77, false); // glyphId
  view.setUint32(107, 20, false); // clipOffset -> 120
  view.setUint16(120, 2, false); // ClipBoxVar
  view.setInt16(122, 10, false);
  view.setInt16(124, 20, false);
  view.setInt16(126, 30, false);
  view.setInt16(128, 40, false);
  view.setUint32(130, 0, false); // dxMin var index
  view.setUint32(134, 0, false); // dyMin var index
  view.setUint32(138, 0, false); // dxMax var index
  view.setUint32(142, 0, false); // dyMax var index

  byteArray.seek(7);
  table.readClipList(byteArray, 100);
  assert.equal(byteArray.offset, 7);
  assert.deepEqual(table.getClipForGlyph(77), { xMin: 60, yMin: 70, xMax: 80, yMax: 90 });
});

test('ColrTable readPaint covers many COLRv1 paint format branches without recursion blowups', () => {
  const table = Object.create(ColrTable.prototype);
  const view = new DataView(new ArrayBuffer(2048));
  table.view = view;
  table.layerPaintOffsets = [20];
  table.getVarDeltas = (_base, count) => new Array(count).fill(0);
  table.readColorLine = () => ({ extend: 0, stops: [] });
  table.readAffine2x3 = () => ({ xx: 1, yx: 0, xy: 0, yy: 1, dx: 0, dy: 0 });

  const setOffset24 = (offset, value) => {
    view.setUint8(offset, (value >>> 16) & 0xff);
    view.setUint8(offset + 1, (value >>> 8) & 0xff);
    view.setUint8(offset + 2, value & 0xff);
  };

  // Shared child paint (format 2 solid) to terminate nested paint branches.
  view.setUint8(20, 2);
  view.setUint16(21, 1, false);
  view.setInt16(23, 0x4000, false);

  const formats = [4, 5, 8, 9, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 20, 21, 23, 24, 25, 26, 27, 30, 29, 32, 31];
  let off = 200;
  for (const fmt of formats) {
    view.setUint8(off, fmt);
    if (fmt !== 11) setOffset24(off + 1, 20);
    if (fmt === 10 || fmt === 11) view.setUint16(off + (fmt === 11 ? 1 : 4), 77, false);
    if (fmt === 12 || fmt === 13 || fmt === 32 || fmt === 31) setOffset24(off + 4, 20);
    if (fmt === 13) view.setUint32(off + 7, 0, false);
    if (fmt === 15 || fmt === 17 || fmt === 29) view.setUint32(off + 8, 0, false);
    if (fmt === 19) view.setUint32(off + 12, 0, false);
    if (fmt === 21) view.setUint32(off + 6, 0, false);
    if (fmt === 23 || fmt === 27) view.setUint32(off + 10, 0, false);
    if (fmt === 25) view.setUint32(off + 6, 0, false);
    if (fmt === 5 || fmt === 9) view.setUint32(off + 16, 0, false);
    if (fmt === 7) view.setUint32(off + 12, 0, false);
    if (fmt === 31) view.setUint32(off + 8, 0, false);
    if (fmt === 31 || fmt === 32) view.setUint8(off + 7, 1);

    const paint = table.readPaint(off, 0, 0);
    assert.equal(paint.format, fmt);
    off += 24;
  }
});

test('Cmap format helper classes map codepoints and bounds correctly', () => {
  const format0Bytes = new Uint8Array(2 + 2 + 256);
  const dv0 = new DataView(format0Bytes.buffer);
  dv0.setUint16(0, format0Bytes.length, false);
  dv0.setUint16(2, 0, false);
  format0Bytes[4 + 65] = 9;
  format0Bytes[4 + 66] = 10;
  const f0 = new CmapFormat0(new ByteArray(format0Bytes));
  assert.equal(f0.getFormatType(), 0);
  assert.equal(f0.getFirst(), 65);
  assert.equal(f0.getLast(), 66);
  assert.equal(f0.mapCharCode(65), 9);
  assert.equal(f0.mapCharCode(999), 0);
  assert.equal(f0.getGlyphIndex(999), null);
  assert.match(f0.toString(), /format: 0/);

  const format6Bytes = new Uint8Array(12);
  const dv6 = new DataView(format6Bytes.buffer);
  dv6.setUint16(0, 12, false);
  dv6.setUint16(2, 0, false);
  dv6.setUint16(4, 100, false);
  dv6.setUint16(6, 2, false);
  dv6.setUint16(8, 300, false);
  dv6.setUint16(10, 301, false);
  const f6 = new CmapFormat6(new ByteArray(format6Bytes));
  assert.equal(f6.getFirst(), 100);
  assert.equal(f6.getLast(), 101);
  assert.equal(f6.mapCharCode(100), 300);
  assert.equal(f6.mapCharCode(102), 0);
  assert.equal(f6.getGlyphIndex(102), null);
  assert.match(f6.toString(), /format: 6/);

  const makeShortReader = (values) => {
    let i = 0;
    return {
      offset: 0,
      readUnsignedShort() { this.offset += 2; return values[i++] ?? 0; },
      readShort() { this.offset += 2; return values[i++] ?? 0; }
    };
  };

  const keys = new Array(256).fill(0);
  keys[0] = 1;
  keys[1] = 1; // selects second parsed subheader due direct key indexing in implementation
  const format2Values = [
    539, 0,
    ...keys,
    0, 1, 0, 0,   // subheader[0] dummy
    10, 2, 5, 4,  // subheader[1]
    0, 40, 41     // glyphIndexArray
  ];
  const f2 = new CmapFormat2(makeShortReader(format2Values));
  assert.equal(f2.getFormatType(), 2);
  assert.equal(f2.getFirst(), 0);
  assert.equal(f2.getLast(), 1);
  assert.equal(f2.getGlyphIndex(0x010A), 46);
  assert.equal(f2.getGlyphIndex(0x0100), null);
  assert.equal(f2.mapCharCode(0x0100), 0);
  assert.match(f2.toString(), /format: 2/);

  const format8Values = [20, 0, 2, 65, 3, 66, 4];
  const format10Values = [20, 0, 2, 500, 11, 501, 12];
  const seqReader = (vals) => {
    let i = 0;
    return { readUnsignedShort: () => vals[i++] ?? 0 };
  };
  const f8 = new CmapFormat8(seqReader(format8Values));
  const f10 = new CmapFormat10(seqReader(format10Values));
  assert.equal(f8.getFormatType(), 8);
  assert.equal(f8.getFirst(), 65);
  assert.equal(f8.getLast(), 66);
  assert.equal(f8.getGlyphIndex(66), 4);
  assert.equal(f8.mapCharCode(70), 0);
  assert.match(f8.toString(), /format: 8/);
  assert.equal(f10.getFormatType(), 10);
  assert.equal(f10.getFirst(), 500);
  assert.equal(f10.getLast(), 501);
  assert.equal(f10.getGlyphIndex(500), 11);
  assert.equal(f10.mapCharCode(700), 0);
  assert.match(f10.toString(), /format: 10/);
});

test('FontParserWOFF.getGlyph applies gvar deltas and phantom metrics on simple glyphs', () => {
  const parser = createWoffParserMock();
  parser.variationCoords = [0.25];
  parser.hmtx = {
    getLeftSideBearing: () => 20,
    getAdvanceWidth: () => 500
  };
  const baseDesc = {
    getPointCount: () => 4,
    getContourCount: () => 1,
    getEndPtOfContours: () => 3,
    getFlags: () => 1,
    getXCoordinate: (p) => [0, 50, 100, 150][p],
    getYCoordinate: (p) => [0, 0, 0, 0][p],
    getXMaximum: () => 150,
    getXMinimum: () => 0,
    getYMaximum: () => 0,
    getYMinimum: () => 0,
    isComposite: () => false,
    resolve: () => null
  };
  parser.glyf = { getDescription: () => baseDesc };
  parser.gvar = {
    getDeltasForGlyph: (_gid, _coords, pointCount) => {
      assert.equal(pointCount, 8); // 4 points + 4 phantom points expected by current impl
      return {
        dx: [10, 0, 0, -10, 5, 15],
        dy: [0, 10, 0, -10, 0, 0],
        touched: [true, false, false, true]
      };
    }
  };

  const glyph = parser.getGlyph(123);
  assert.ok(glyph);
  assert.equal(glyph.leftSideBearing, 25);
  assert.equal(glyph.advanceWidth, 510);
  assert.equal(glyph.getPointCount(), 6); // 4 + phantom points
  assert.equal(glyph.getPoint(0).x, 10);
});

test('FontParserWOFF.getGlyph falls back to CFF descriptions when glyf is absent', () => {
  const parser = createWoffParserMock();
  parser.variationCoords = [];
  parser.glyf = { getDescription: () => null };
  parser.hmtx = {
    getLeftSideBearing: () => 9,
    getAdvanceWidth: () => 333
  };
  const cffDesc = {
    getPointCount: () => 1,
    getContourCount: () => 1,
    getEndPtOfContours: () => 0,
    getFlags: () => 1,
    getXCoordinate: () => 7,
    getYCoordinate: () => 8
  };
  parser.cff = { getGlyphDescription: () => cffDesc };
  const glyph = parser.getGlyph(5);
  assert.ok(glyph);
  assert.equal(glyph.isCubic, true);
  assert.equal(glyph.leftSideBearing, 9);
  assert.equal(glyph.advanceWidth, 333);
});

test('FontParserWOFF color layer helpers handle transparent and missing palette entries', () => {
  const parser = createWoffParserMock();
  parser.colr = {
    getLayersForGlyph: () => [
      { glyphId: 1, paletteIndex: 0xffff },
      { glyphId: 2, paletteIndex: 5 },
      { glyphId: 3, paletteIndex: 0 }
    ]
  };
  parser.cpal = {
    getPalette: () => [{ red: 10, green: 20, blue: 30, alpha: 128 }]
  };
  assert.deepEqual(parser.getColorLayersForGlyph(100), [
    { glyphId: 1, color: null, paletteIndex: 0xffff },
    { glyphId: 2, color: null, paletteIndex: 5 },
    { glyphId: 3, color: 'rgba(10, 20, 30, 0.5019607843137255)', paletteIndex: 0 }
  ]);
  parser.getGlyphIndexByChar = () => null;
  assert.deepEqual(parser.getColorLayersForChar('A'), []);
});

test('FontParserWOFF.applyIupDeltas and interpolate cover untouched/single and degenerate branches', () => {
  const parser = createWoffParserMock();
  const base = {
    getPointCount: () => 3,
    getContourCount: () => 1,
    getEndPtOfContours: () => 2,
    getXCoordinate: (i) => [0, 50, 100][i],
    getYCoordinate: (i) => [0, 0, 0][i]
  };

  const dx1 = [0, 0, 0];
  const dy1 = [0, 0, 0];
  parser.applyIupDeltas(base, dx1, dy1, [false, false, false]);
  assert.deepEqual(dx1, [0, 0, 0]);

  const dx2 = [20, 0, 0];
  const dy2 = [5, 0, 0];
  parser.applyIupDeltas(base, dx2, dy2, [true, false, false]);
  assert.deepEqual(dx2, [20, 20, 20]);
  assert.deepEqual(dy2, [5, 5, 5]);

  assert.equal(parser.interpolate(5, 5, 9, 30, 7), 9);
});

test('FontParserWOFF.getMarkAnchorsForGlyph collects anchors across mark/base/ligature/cursive subtables', () => {
  const parser = createWoffParserMock();
  parser.gpos = {};

  const markBase = Object.create(MarkBasePosFormat1.prototype);
  markBase.markCoverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markBase.markArray = { marks: [{ markClass: 1, anchor: { x: 10, y: 20 } }] };
  markBase.baseCoverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markBase.baseArray = { baseRecords: [{ anchors: [null, { x: 11, y: 21 }] }] };

  const markLig = Object.create(MarkLigPosFormat1.prototype);
  markLig.markCoverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markLig.markArray = { marks: [{ markClass: 2, anchor: { x: 30, y: 40 } }] };
  markLig.ligatureCoverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markLig.ligatureArray = {
    ligatures: [{
      components: [
        [null, { x: 31, y: 41 }],
        [{ x: 32, y: 42 }]
      ]
    }]
  };

  const markMark = Object.create(MarkMarkPosFormat1.prototype);
  markMark.mark1Coverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markMark.mark1Array = { marks: [{ markClass: 3, anchor: { x: 50, y: 60 } }] };
  markMark.mark2Coverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  markMark.mark2Array = { records: [{ anchors: [{ x: 51, y: 61 }] }] };

  const cursive = Object.create(CursivePosFormat1.prototype);
  cursive.coverage = { findGlyph: (gid) => (gid === 7 ? 0 : -1) };
  cursive.entryExitRecords = [{ entry: { x: 70, y: 80 }, exit: { x: 71, y: 81 } }];

  const anchors = parser.getMarkAnchorsForGlyph(7, [markBase, markLig, markMark, cursive]);
  assert.ok(anchors.some(a => a.type === 'mark' && a.classIndex === 1));
  assert.ok(anchors.some(a => a.type === 'base' && a.classIndex === 1));
  assert.ok(anchors.some(a => a.type === 'ligature'));
  assert.ok(anchors.some(a => a.type === 'mark2'));
  assert.ok(anchors.some(a => a.type === 'cursive-entry'));
  assert.ok(anchors.some(a => a.type === 'cursive-exit'));

  parser.gpos.lookupList = {
    getLookups: () => [{
      getSubtableCount: () => 1,
      getSubtable: () => markBase
    }]
  };
  const inferred = parser.getMarkAnchorsForGlyph(7);
  assert.ok(inferred.length > 0);
});

test('FontParserWOFF.flattenColrV1Paint covers nested glyph and referenced COLR glyph branches', () => {
  const parser = createWoffParserMock();
  parser.cpal = {
    getPalette: () => [{ red: 1, green: 2, blue: 3, alpha: 255 }]
  };
  parser.getColrV1LayersForGlyph = (gid) => [{ glyphId: gid, color: 'rgba(1,2,3,1)', paletteIndex: 0 }];

  const nested = parser.flattenColrV1Paint({
    format: 10,
    glyphID: 100,
    paint: { format: 1, layers: [{ format: 10, glyphID: 200, paint: { format: 2, paletteIndex: 0, alpha: 0.5 } }] }
  }, 0);
  assert.equal(nested.length, 1);
  assert.equal(nested[0].glyphId, 100);

  const ref = parser.flattenColrV1Paint({ format: 11, glyphID: 321 }, 0);
  assert.deepEqual(ref, [{ glyphId: 321, color: 'rgba(1,2,3,1)', paletteIndex: 0 }]);
  assert.deepEqual(parser.flattenColrV1Paint({ format: 99 }, 0), []);
});

test('FontParserWOFF convenience API covers variation, name scoring, and svg fallback branches', async () => {
  const parser = createWoffParserMock();
  parser.variationCoords = [];
  let colrCoords = null;
  parser.colr = { setVariationCoords: (coords) => { colrCoords = coords.slice(); } };
  parser.fvar = {
    axes: [
      { name: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 },
      { name: 'wdth', minValue: 100, defaultValue: 100, maxValue: 100 } // zero span
    ]
  };
  assert.equal(parser.getVariationAxes().length, 2);
  parser.setVariationByAxes({ wght: 900 });
  assert.deepEqual(parser.variationCoords, [1, 0]);
  assert.deepEqual(colrCoords, [1, 0]);

  parser.pName = {
    getRecord: (id) => (id === 1 ? 'Family' : ''),
    records: [
      { nameId: 2, record: 'Mac Name', platformId: Table.platformMacintosh, languageId: 0 },
      { nameId: 2, record: 'Unicode Name', platformId: Table.platformAppleUnicode, languageId: 0 },
      { nameId: 2, record: 'MS Name', platformId: Table.platformMicrosoft, languageId: 0x0409 }
    ]
  };
  assert.equal(parser.getNameRecord(1), 'Family');
  assert.equal(parser.getPreferredNameRecord(2), 'MS Name');
  assert.equal(parser.getAllNameRecords().length, 3);
  assert.equal(parser.getAllNameRecordsDetailed().length, 3);

  const noSvg = await parser.getSvgDocumentForGlyphAsync(1);
  assert.deepEqual(noSvg, { svgText: null, isCompressed: false });
  parser.svg = { getSvgDocumentForGlyphAsync: async () => ({ svgText: '<svg/>', isCompressed: true }) };
  const hasSvg = await parser.getSvgDocumentForGlyphAsync(2);
  assert.deepEqual(hasSvg, { svgText: '<svg/>', isCompressed: true });
});

test('GlyfCompositeDescript resolve guards recursive component references', () => {
  const desc = Object.create(GlyfCompositeDescript.prototype);
  desc.components = [{
    glyphIndex: 42,
    firstIndex: 0,
    firstContour: 0,
    pointCount: 0,
    contourCount: 0,
    isArgsAreXY: () => true,
    scaleX: (x) => x,
    scaleY: (_x, y) => y
  }];
  desc.beingResolved = false;
  desc.resolved = false;
  desc.pointCount = 0;
  desc.contourCount = 0;
  desc.parentTable = { getDescription: () => desc };

  assert.doesNotThrow(() => desc.resolve());
  assert.equal(desc.resolved, true);
});

test('FontParserWOFF applyGposPositioning executes single/pair and mark/cursive attachment branches', () => {
  const parser = createWoffParserMock();
  const single = Object.create(SinglePosSubtable.prototype);
  single.getAdjustment = (gid) => (gid === 10 ? { xPlacement: 1, yPlacement: 2, xAdvance: 3, yAdvance: 4 } : null);
  const pair = Object.create(PairPosSubtable.prototype);
  pair.getPairValue = (left, right) => (left === 10 && right === 11 ? {
    v1: { xPlacement: 5, yPlacement: 6, xAdvance: 7, yAdvance: 8 },
    v2: { xPlacement: 9, yPlacement: 10, xAdvance: 11, yAdvance: 12 }
  } : null);
  const markBase = Object.create(MarkBasePosFormat1.prototype);
  const cursive = Object.create(CursivePosFormat1.prototype);

  parser.gpos = { getSubtablesForFeatures: () => [single, pair, markBase, cursive] };
  parser.gdef = { getGlyphClass: (gid) => (gid === 11 || gid === 12 ? 3 : 1) };
  parser.getMarkAnchorsForGlyph = (gid) => {
    if (gid === 10) return [{ type: 'ligature', classIndex: 1, x: 100, y: 50, componentIndex: 1 }, { type: 'cursive-exit', classIndex: 0, x: 10, y: 5 }];
    if (gid === 11) return [{ type: 'mark', classIndex: 1, x: 60, y: 20 }, { type: 'mark2', classIndex: 1, x: 70, y: 30 }, { type: 'cursive-entry', classIndex: 0, x: 2, y: 1 }];
    if (gid === 12) return [{ type: 'mark', classIndex: 1, x: 40, y: 10 }];
    return [];
  };

  const glyphIndices = [10, 11, 12];
  const positioned = glyphIndices.map((glyphIndex) => ({ glyphIndex, xAdvance: 500, xOffset: 0, yOffset: 0, yAdvance: 0 }));
  parser.applyGposPositioning(glyphIndices, positioned, ['kern', 'mark', 'curs'], ['DFLT']);

  assert.ok(positioned[0].xAdvance > 500); // single/pair adjustments applied
  assert.equal(positioned[2].xAdvance, 0); // mark attachment zeroes advance
});

test('FontParserWOFF kerning and glyph index helpers cover warning and fallback branches', () => {
  const parser = createWoffParserMock();
  parser.cmap = {
    getCmapFormats: () => [{ mapCharCode: (cp) => (cp > 0 ? 9 : 0) }],
    formats: []
  };
  assert.equal(parser.getGlyphIndexByChar('ABC'), 9);
  const diags = parser.getDiagnostics();
  assert.ok(diags.some((d) => d.code === 'MULTI_CHAR_INPUT'));

  parser.kern = {};
  assert.equal(parser.getKerningValueByGlyphs(1, 2), 0);
  parser.getGlyphIndexByChar = (ch) => (ch === 'a' ? 10 : ch === 'b' ? 11 : null);
  parser.getKerningValueByGlyphs = () => 0;
  parser.getGposKerningValueByGlyphs = () => 7;
  assert.equal(parser.getKerningValue('a', 'b'), 7);
});

testSweep('getTableByType known tags are null-or-object across TTF/OTF/WOFF fixtures', () => {
  const ttf = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/noto/NotoSans-Regular.ttf')));
  const otf = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/curated/SourceSerif4-Regular.otf')));
  const woff = FontParser.fromArrayBuffer(toArrayBuffer(readBytes('truetypefonts/ubuntu.woff')));
  const tags = Object.values(Table).filter((v) => typeof v === 'number');

  for (const font of [ttf, otf, woff]) {
    for (const tag of tags) {
      assert.doesNotThrow(() => {
        const value = font.getTableByType(tag);
        assert.ok(value === null || typeof value === 'object');
      });
    }
  }
});

test('missing-table paths do not emit duplicate diagnostics across repeated calls', () => {
  const parser = createTtfParserMock();
  parser.gsub = null;
  parser.gpos = null;
  parser.kern = null;
  parser.getGlyphIndicesForString = () => [1, 2, 3];
  parser.getGlyph = () => ({ advanceWidth: 500 });
  parser.getKerningValueByGlyphs = () => 0;
  parser.getGposKerningValueByGlyphs = () => 0;
  parser.getGlyphIndexByChar = (ch) => (ch ? 1 : null);

  const savedWarn = console.warn;
  const warns = [];
  console.warn = (...args) => warns.push(args.join(' '));
  try {
    for (let i = 0; i < 20; i++) {
      parser.getGlyphIndicesForStringWithGsub('abc', ['liga'], ['latn']);
      parser.layoutString('abc', { gpos: true, gsubFeatures: ['liga'], scriptTags: ['latn'] });
    }
  } finally {
    console.warn = savedWarn;
  }
  assert.ok(warns.length <= 1);
});

test('FontParserTTF.getGlyphIndexByChar handles astral code points without multi-char warning', () => {
  const parser = createTtfParserMock();
  parser.cmap = { formats: [], getCmapFormats: () => [] };
  parser.getBestCmapFormatFor = (cp) => ({
    mapCharCode: (x) => (x === cp ? 321 : 0)
  });

  const savedWarn = console.warn;
  const warns = [];
  console.warn = (msg) => warns.push(String(msg));
  try {
    const idx = parser.getGlyphIndexByChar('😀');
    assert.equal(idx, 321);
    assert.equal(warns.some((w) => /multiple characters/i.test(w)), false);
  } finally {
    console.warn = savedWarn;
  }
});

test('ByteArray.seek exact EOF behavior is explicit (position === byteLength throws)', () => {
  const ba = new ByteArray(Uint8Array.from([1, 2, 3]));
  assert.doesNotThrow(() => ba.seek(2));
  assert.throws(() => ba.seek(3), /out of bounds/i);
});

test('GsubTable read and script/subtable discovery fallback branches execute', () => {
  const originalReaders = {
    s1: SingleSubst.read,
    s2: MultipleSubst.read,
    s3: AlternateSubst.read,
    s4: LigatureSubst.read,
    s5: ContextSubst.read,
    s6: ChainingSubst.read
  };
  try {
    SingleSubst.read = () => 's1';
    MultipleSubst.read = () => 's2';
    AlternateSubst.read = () => 's3';
    LigatureSubst.read = () => 's4';
    ContextSubst.read = () => 's5';
    ChainingSubst.read = () => 's6';
    const gsub = Object.create(GsubTable.prototype);
    assert.equal(gsub.read(1, {}, 0), 's1');
    assert.equal(gsub.read(2, {}, 0), 's2');
    assert.equal(gsub.read(3, {}, 0), 's3');
    assert.equal(gsub.read(4, {}, 0), 's4');
    assert.equal(gsub.read(5, {}, 0), 's5');
    assert.equal(gsub.read(6, {}, 0), 's6');
    assert.equal(gsub.read(9, {}, 0), null);
  } finally {
    SingleSubst.read = originalReaders.s1;
    MultipleSubst.read = originalReaders.s2;
    AlternateSubst.read = originalReaders.s3;
    LigatureSubst.read = originalReaders.s4;
    ContextSubst.read = originalReaders.s5;
    ChainingSubst.read = originalReaders.s6;
  }

  const gsub2 = Object.create(GsubTable.prototype);
  gsub2.scriptList = {
    findScript: (tag) => (tag === 'latn' ? null : tag === 'DFLT' ? null : tag === 'arab' ? { tag } : null),
    getScriptRecords: () => [{ tag: ('a'.charCodeAt(0) << 24) | ('r'.charCodeAt(0) << 16) | ('a'.charCodeAt(0) << 8) | 'b'.charCodeAt(0) }]
  };
  const pref = gsub2.findPreferredScript(['latn', 'DFLT']);
  assert.deepEqual(pref, { tag: 'arab' });

  gsub2.getDefaultLangSys = () => ({});
  gsub2.featureList = { findFeature: () => null };
  assert.deepEqual(gsub2.getSubtablesForFeatures(['liga'], ['DFLT']), []);
  assert.equal(gsub2.getType(), Table.GSUB);
});

test('ColrTable helper branches cover readColorLine and variation-store early return', () => {
  const table = Object.create(ColrTable.prototype);
  const bytes = new Uint8Array(128);
  const view = new DataView(bytes.buffer);
  table.view = view;
  table.variationCoords = [2];

  view.setUint8(0, 1); // extend
  view.setUint16(1, 2, false); // numStops
  view.setInt16(3, 0x2000, false); // 0.5
  view.setUint16(5, 3, false);
  view.setInt16(7, 0x4000, false); // 1.0
  view.setInt16(9, 0x4000, false); // 1.0
  view.setUint16(11, 4, false);
  view.setInt16(13, 0x2000, false); // 0.5
  const colorLine = table.readColorLine(0);
  assert.equal(colorLine.stops.length, 2);

  const ba = new ByteArray(bytes);
  view.setUint16(20, 2, false); // unsupported variation store format
  ba.seek(33);
  table.readVariationStore(ba, 20);
  assert.equal(ba.offset, 33);

  table.varStore = { start: 40, dataOffsets: [16], regions: [[{ start: 0, peak: 1, end: 1 }]] };
  view.setUint16(56, 1, false); // itemCount
  view.setUint16(58, 1, false); // shortDeltaCount
  view.setUint16(60, 1, false); // regionIndexCount
  view.setUint16(62, 0, false); // regionIdx
  view.setInt16(64, 100, false); // delta
  assert.equal(table.getVarDelta(0), 0); // coord out of [start,end] -> scalar 0
});

test('FontParserTTF metadata helpers cover fsType/fsSelection/style and cmap selection branches', () => {
  const parser = createTtfParserMock();

  assert.equal(parser.getOs2Metrics(), null);
  assert.equal(parser.getPostMetrics(), null);
  assert.equal(parser.getWeightClass(), 0);
  assert.equal(parser.getWidthClass(), 0);
  assert.deepEqual(parser.getFsTypeFlags(), ['installable-embedding']);
  assert.deepEqual(parser.getFsSelectionFlags(), []);
  assert.equal(parser.isMonospace(), false);

  parser.os2 = {
    version: 5,
    usWeightClass: 800,
    usWidthClass: 4,
    fsType: 0x0002 | 0x0004 | 0x0008 | 0x0100 | 0x0200,
    fsSelection: 0x0001 | 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020 | 0x0040 | 0x0080 | 0x0100 | 0x0200,
    sTypoAscender: 1,
    sTypoDescender: -1,
    sTypoLineGap: 2,
    usWinAscent: 3,
    usWinDescent: 4,
    usFirstCharIndex: 5,
    usLastCharIndex: 6,
    achVendorID: 0x41424320, // "ABC "
    ulUnicodeRange1: 7,
    ulUnicodeRange2: 8,
    ulUnicodeRange3: 9,
    ulUnicodeRange4: 10,
    ulCodePageRange1: 11,
    ulCodePageRange2: 12,
    sxHeight: 13,
    sCapHeight: 14,
    usDefaultChar: 15,
    usBreakChar: 16,
    usMaxContext: 17,
    usLowerOpticalPointSize: 18,
    usUpperOpticalPointSize: 19,
    panose: {
      bFamilyType: 1, bSerifStyle: 2, bWeight: 3, bProportion: 4, bContrast: 5,
      bStrokeVariation: 6, bArmStyle: 7, bLetterform: 8, bMidline: 9, bXHeight: 10
    }
  };
  parser.post = { version: 0x00020000, italicAngle: 0, underlinePosition: -10, underlineThickness: 20, isFixedPitch: 1 };
  parser.pName = {
    records: [
      { nameId: 2, record: 'Italic-ish', platformId: Table.platformMacintosh, languageId: 0 },
      { nameId: 2, record: 'Bold', platformId: Table.platformAppleUnicode, languageId: 0 }
    ]
  };

  const os2 = parser.getOs2Metrics();
  assert.equal(os2.vendorId, 'ABC');
  assert.equal(os2.lowerOpticalPointSize, 18);
  assert.equal(os2.upperOpticalPointSize, 19);
  assert.equal(os2.panose.weight, 3);
  assert.equal(parser.getPostMetrics().isFixedPitch, true);
  assert.equal(parser.isMonospace(), true);
  assert.equal(parser.getWeightClass(), 800);
  assert.equal(parser.getWidthClass(), 4);
  assert.ok(parser.getFsTypeFlags().includes('restricted-license-embedding'));
  assert.ok(parser.getFsTypeFlags().includes('bitmap-embedding-only'));
  assert.ok(parser.getFsSelectionFlags().includes('oblique'));
  assert.ok(parser.getFsSelectionFlags().includes('bold'));
  assert.equal(parser.isItalic(), true); // fsSelection bit
  assert.equal(parser.isBold(), true); // fsSelection bit

  parser.os2.fsSelection = 0;
  parser.os2.usWeightClass = 400;
  parser.post.italicAngle = 1;
  assert.equal(parser.isItalic(), true); // italicAngle fallback
  parser.post.italicAngle = 0;
  parser.pName.records = [{ nameId: 2, record: 'Regular Oblique', platformId: Table.platformMacintosh, languageId: 0 }];
  assert.equal(parser.isItalic(), true); // name fallback
  parser.pName.records = [{ nameId: 2, record: 'Regular Bold', platformId: Table.platformMacintosh, languageId: 0 }];
  assert.equal(parser.isBold(), true); // name fallback
  parser.pName.records = [{ nameId: 2, record: 'Regular', platformId: Table.platformMacintosh, languageId: 0 }];
  assert.equal(parser.isBold(), false);

  parser.cmap = {
    getCmapFormats: (platformId, encodingId) => {
      if (platformId === 3 && encodingId === 10) return [{ format: 12, tag: 'ucs4' }];
      if (platformId === 3 && encodingId === 1) return [{ getFormatType: () => 4, tag: 'bmp' }];
      return [];
    },
    formats: [{ format: 6, tag: 'fallback' }]
  };
  assert.equal(parser.getBestCmapFormatFor(0x1F600).tag, 'ucs4');
  assert.equal(parser.getBestCmapFormatFor(65).tag, 'bmp');
  assert.equal(parser.pickBestFormat([{ format: 2 }, { format: 12 }]).format, 12);
  assert.equal(parser.pickBestFormat([]), null);
});

test('CffTable and Cff2Table helper branches cover fdselect, bias, and number decoding', () => {
  const cff = Object.create(CffTable.prototype);
  const cff2 = Object.create(Cff2Table.prototype);
  assert.equal(cff.getSubrBias(new Array(100)), 107);
  assert.equal(cff.getSubrBias(new Array(2000)), 1131);
  assert.equal(cff.getSubrBias(new Array(34000)), 32768);
  assert.equal(cff2.getSubrBias(new Array(100)), 107);
  assert.equal(cff2.getSubrBias(new Array(2000)), 1131);
  assert.equal(cff2.getSubrBias(new Array(34000)), 32768);

  const n1 = cff.readCharStringNumber(Uint8Array.from([139]), 0); // 0
  const n2 = cff.readCharStringNumber(Uint8Array.from([247, 0]), 0); // +108
  const n3 = cff.readCharStringNumber(Uint8Array.from([251, 0]), 0); // -108
  const n4 = cff.readCharStringNumber(Uint8Array.from([28, 0xff, 0xfe]), 0); // -2
  const n5 = cff.readCharStringNumber(Uint8Array.from([255, 0, 1, 0, 0]), 0); // 1
  const n6 = cff.readCharStringNumber(Uint8Array.from([12]), 0); // default
  assert.deepEqual([n1[0], n2[0], n3[0], n4[0], n5[0], n6[0]], [0, 108, -108, -2, 1, 0]);
  assert.deepEqual(cff2.readCharStringNumber(Uint8Array.from([139]), 0), [0, 1]);

  // format 0
  const f0 = new ByteArray(Uint8Array.from([0, 9, 8, 7]));
  assert.deepEqual(cff.readFdSelect(f0, 0, 3), [9, 8, 7]);
  // format 3
  const f3 = new Uint8Array(11);
  const v3 = new DataView(f3.buffer);
  v3.setUint8(0, 3);
  v3.setUint16(1, 2, false); // ranges
  v3.setUint16(3, 0, false); v3.setUint8(5, 5); // start 0 -> fd 5
  v3.setUint16(6, 2, false); v3.setUint8(8, 7); // start 2 -> fd 7
  v3.setUint16(9, 4, false); // sentinel
  assert.deepEqual(cff.readFdSelect(new ByteArray(f3), 0, 4), [5, 5, 7, 7]);
  // format 4
  const f4 = new Uint8Array(21);
  const v4 = new DataView(f4.buffer);
  v4.setUint8(0, 4);
  v4.setUint32(1, 2, false); // ranges
  v4.setUint32(5, 0, false); v4.setUint16(9, 5, false);
  v4.setUint32(11, 2, false); v4.setUint16(15, 7, false);
  v4.setUint32(17, 4, false); // sentinel
  assert.deepEqual(cff.readFdSelect(new ByteArray(f4), 0, 4), [5, 5, 7, 7]);
  const f3c2 = new Uint8Array(13);
  const v3c2 = new DataView(f3c2.buffer);
  v3c2.setUint8(0, 3);
  v3c2.setUint16(1, 2, false); // ranges
  v3c2.setUint16(3, 0, false); v3c2.setUint16(5, 5, false); // start 0 -> fd 5
  v3c2.setUint16(7, 2, false); v3c2.setUint16(9, 7, false); // start 2 -> fd 7
  v3c2.setUint16(11, 4, false); // sentinel
  assert.deepEqual(cff2.readFdSelect(new ByteArray(f3c2), 0, 4), [5, 5, 7, 7]);
  assert.deepEqual(cff2.readFdSelect(new ByteArray(f4), 0, 4), [5, 5, 7, 7]);
});

test('Cff2Table.readVariationStore handles alt-format prefix and unsupported stores', () => {
  const cff2 = Object.create(Cff2Table.prototype);
  cff2.vstoreRegionCounts = [];
  cff2.vstoreRegionIndices = [];
  cff2.vstoreRegions = [];
  cff2.vstoreAxisCount = 0;

  const bad = new ByteArray(Uint8Array.from([0, 2, 0, 0]));
  bad.seek(3);
  cff2.readVariationStore(bad, 0);
  assert.equal(bad.offset, 3);

  // Starts with 16-bit prefix then real format=1 at +2.
  const bytes = new Uint8Array(40);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0, false); // prefix (not format 1)
  view.setUint16(2, 1, false); // actual format
  view.setUint32(4, 14, false); // regionListOffset => storeOffset(2)+14=16
  view.setUint16(8, 1, false); // ivdCount
  view.setUint32(10, 26, false); // ivd offset => storeOffset(2)+26=28
  view.setUint16(16, 1, false); // axisCount
  view.setUint16(18, 1, false); // regionCount
  view.setInt16(20, 0, false); // start
  view.setInt16(22, 16384, false); // peak = 1
  view.setInt16(24, 16384, false); // end = 1
  view.setUint16(28, 1, false); // itemCount
  view.setUint16(30, 0, false); // shortDeltaCount
  view.setUint16(32, 1, false); // regionIndexCount
  view.setUint16(34, 0, false); // region index

  const ba = new ByteArray(bytes);
  ba.seek(5);
  cff2.readVariationStore(ba, 0);
  assert.equal(ba.offset, 5);
  assert.equal(cff2.vstoreAxisCount, 1);
  assert.equal(cff2.vstoreRegions.length, 1);
  assert.equal(cff2.vstoreRegionCounts[0], 1);
  assert.deepEqual(cff2.vstoreRegionIndices[0], [0]);
});

test('CFF and CFF2 charstring parsing caps recursive subr depth to avoid stack overflow', () => {
  const recursiveSubr = Uint8Array.from([32, 10, 11]); // push -107, callsubr, return

  const cff = Object.create(CffTable.prototype);
  cff.globalSubrs = [];
  cff.charStrings = [];
  assert.doesNotThrow(() => {
    const parsed = cff.parseCharString(Uint8Array.from([32, 10, 14]), [recursiveSubr]);
    assert.ok(Array.isArray(parsed.points));
    assert.ok(Array.isArray(parsed.endPts));
  });
  cff.localSubrs = [recursiveSubr];
  cff.privateInfos = [];
  cff.fdSelect = [0];
  cff.charStrings = [Uint8Array.from([32, 10, 14])];
  const debugOps = cff.debugCharString(0);
  assert.ok(debugOps.some((op) => op.op === 'MAX_SUBR_DEPTH'));

  const cff2 = Object.create(Cff2Table.prototype);
  cff2.globalSubrs = [];
  cff2.charStrings = [];
  cff2.vstoreRegionCounts = [];
  cff2.vstoreRegionIndices = [];
  cff2.vstoreRegions = [];
  cff2.variationCoords = [];
  assert.doesNotThrow(() => {
    const parsed = cff2.parseCharString(Uint8Array.from([32, 10, 14]), [recursiveSubr]);
    assert.ok(Array.isArray(parsed.points));
    assert.ok(Array.isArray(parsed.endPts));
  });
});

test('FontParserTTF legacy name/os2/post info helpers return stable shapes', () => {
  const parser = createTtfParserMock();
  parser.getNameRecord = (id) => `n${id}`;
  assert.deepEqual(parser.getNameInfo(), {
    family: 'n1',
    subfamily: 'n2',
    fullName: 'n4',
    postScriptName: 'n6',
    version: 'n5',
    manufacturer: 'n8',
    designer: 'n9',
    description: 'n10',
    typoFamily: 'n16',
    typoSubfamily: 'n17'
  });

  assert.equal(parser.getOs2Info(), null);
  assert.equal(parser.getPostInfo(), null);

  parser.os2 = {
    achVendorID: 0x41420020, // "AB\0 "
    usWeightClass: 500,
    usWidthClass: 5,
    sTypoAscender: 100,
    sTypoDescender: -50,
    sTypoLineGap: 20,
    usWinAscent: 110,
    usWinDescent: 55,
    ulUnicodeRange1: 1,
    ulUnicodeRange2: 2,
    ulUnicodeRange3: 3,
    ulUnicodeRange4: 4,
    ulCodePageRange1: 5,
    ulCodePageRange2: 6,
    fsSelection: 0x20
  };
  parser.post = { italicAngle: 0x00010000, underlinePosition: -3, underlineThickness: 2, isFixedPitch: 0 };

  const os2 = parser.getOs2Info();
  assert.equal(os2.vendorId, 'AB ');
  assert.deepEqual(os2.unicodeRanges, [1, 2, 3, 4]);
  assert.deepEqual(os2.codePageRanges, [5, 6]);

  const post = parser.getPostInfo();
  assert.equal(post.italicAngle, 1);
  assert.equal(post.underlinePosition, -3);
  assert.equal(post.underlineThickness, 2);
  assert.equal(post.isFixedPitch, 0);
});

test('FontParserTTF.load handles success, HTTP errors, and fetch-body failures', async () => {
  const savedFetch = globalThis.fetch;
  const ttfBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => toArrayBuffer(ttfBytes) });
    const loaded = await FontParserTTF.load('https://example.test/ok.ttf');
    assert.ok(loaded instanceof FontParserTTF);

    globalThis.fetch = async () => ({ ok: false, status: 503, arrayBuffer: async () => new ArrayBuffer(0) });
    await assert.rejects(() => FontParserTTF.load('https://example.test/http-fail.ttf'), /HTTP error! Status: 503/);

    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => { throw new Error('body-fail'); } });
    await assert.rejects(() => FontParserTTF.load('https://example.test/body-fail.ttf'), /body-fail/);
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('FontParserTTF color layer and COLRv1 flatten helpers cover null/missing and recursion branches', () => {
  const parser = createTtfParserMock();
  parser.colr = {
    getLayersForGlyph: () => [
      { glyphId: 1, paletteIndex: 0xffff },
      { glyphId: 2, paletteIndex: 4 },
      { glyphId: 3, paletteIndex: 0 }
    ]
  };
  parser.cpal = {
    getPalette: () => [{ red: 10, green: 20, blue: 30, alpha: 255 }]
  };
  assert.deepEqual(parser.getColorLayersForGlyph(100), [
    { glyphId: 1, color: null, paletteIndex: 0xffff },
    { glyphId: 2, color: null, paletteIndex: 4 },
    { glyphId: 3, color: 'rgba(10, 20, 30, 1)', paletteIndex: 0 }
  ]);
  parser.getGlyphIndexByChar = () => null;
  assert.deepEqual(parser.getColorLayersForChar('A'), []);

  const nested = parser.flattenColrV1Paint({
    format: 10,
    glyphID: 50,
    paint: {
      format: 1,
      layers: [{ format: 10, glyphID: 9, paint: { format: 2, paletteIndex: 0, alpha: 1 } }]
    }
  }, 0);
  assert.equal(nested.length, 1);
  assert.equal(nested[0].glyphId, 50);

  parser.getColrV1LayersForGlyph = (gid) => [{ glyphId: gid, color: 'rgba(1,2,3,1)', paletteIndex: 0 }];
  assert.deepEqual(parser.flattenColrV1Paint({ format: 11, glyphID: 77 }, 0), [
    { glyphId: 77, color: 'rgba(1,2,3,1)', paletteIndex: 0 }
  ]);
});

test('FontParserTTF helper branches cover inferred anchors, IUP single-touch, and format fallback', () => {
  const parser = createTtfParserMock();
  parser.gpos = {
    lookupList: {
      getLookups: () => [
        null,
        {
          getSubtableCount: () => 2,
          getSubtable: (i) => (i === 0 ? null : markBase)
        }
      ]
    }
  };

  const markBase = Object.create(MarkBasePosFormat1.prototype);
  markBase.markCoverage = { findGlyph: (gid) => (gid === 5 ? 0 : -1) };
  markBase.markArray = { marks: [{ markClass: 0, anchor: { x: 4, y: 5 } }] };
  markBase.baseCoverage = { findGlyph: () => -1 };
  markBase.baseArray = { baseRecords: [] };

  const inferred = parser.getMarkAnchorsForGlyph(5);
  assert.ok(inferred.some((a) => a.type === 'mark'));

  const base = {
    getPointCount: () => 3,
    getContourCount: () => 1,
    getEndPtOfContours: () => 2,
    getXCoordinate: (i) => [0, 50, 100][i],
    getYCoordinate: (i) => [0, 0, 0][i]
  };
  const dx = [7, 0, 0];
  const dy = [2, 0, 0];
  parser.applyIupDeltas(base, dx, dy, [true, false, false]);
  assert.deepEqual(dx, [7, 7, 7]);
  assert.deepEqual(dy, [2, 2, 2]);
  assert.equal(parser.interpolate(10, 10, 9, 99, 50), 9);

  assert.equal(parser.pickBestFormat([{ format: 13 }, { format: 15 }]).format, 13);
  parser.pName = null;
  assert.deepEqual(parser.getAllNameRecords(), []);
});

test('GsubTable getters and subtable collection include only non-null lookups/subtables', () => {
  const gsub = Object.create(GsubTable.prototype);
  gsub.scriptList = { id: 'script-list' };
  gsub.featureList = {
    findFeature: (langSys, tag) => (tag === 'liga' ? { getLookupCount: () => 2 } : null)
  };
  gsub.lookupList = {
    getLookup: (feature, i) => {
      if (i === 0) return null;
      return {
        getSubtableCount: () => 3,
        getSubtable: (j) => (j === 1 ? { ok: true } : null)
      };
    }
  };
  gsub.findPreferredScript = () => ({});
  gsub.getDefaultLangSys = () => ({});

  assert.equal(gsub.getScriptList().id, 'script-list');
  assert.equal(gsub.getFeatureList(), gsub.featureList);
  assert.equal(gsub.getLookupList(), gsub.lookupList);
  assert.deepEqual(gsub.getSubtablesForFeatures(['liga'], ['DFLT']), [{ ok: true }]);
});

test('GsubTable.applyLookupAt can apply ligature substitution fallback branch directly', () => {
  const ligatureSubtable = Object.create(LigatureSubstFormat1.prototype);
  ligatureSubtable.tryLigature = (glyphs, index) => (glyphs[index] === 7 ? { glyphId: 99, length: 2 } : null);

  const gsub = {
    lookupList: {
      getLookups: () => [{
        getSubtableCount: () => 1,
        getSubtable: () => ligatureSubtable,
        getFlag: () => 0
      }]
    },
    isGlyphIgnored: () => false
  };

  const out = GsubTable.prototype.applyLookupAt.call(gsub, 0, [7, 8, 1], 0);
  assert.deepEqual(out, [99, 1]);
});

test('GsubTable.findPreferredScript returns null when no scripts are available', () => {
  const gsub = Object.create(GsubTable.prototype);
  gsub.scriptList = {
    findScript: () => null,
    getScriptRecords: () => []
  };
  assert.equal(gsub.findPreferredScript(['DFLT', 'latn']), null);
});

test('FontParserWOFF2 constructor is instantiable and fromArrayBuffer still parses through decoder', () => {
  const instance = new FontParserWOFF2();
  assert.ok(instance instanceof FontParserWOFF2);

  const original = setWoff2Decoder((bytes) => bytes);
  try {
    const ttfBytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
    const parsed = FontParserWOFF2.fromArrayBuffer(toArrayBuffer(ttfBytes));
    assert.ok(parsed instanceof FontParserTTF);
  } finally {
    setWoff2Decoder(original);
  }
});

test('FontParserTTF.applyGposPositioning exercises single/pair positioning branches directly', () => {
  const parser = createTtfParserMock();
  const single = Object.create(SinglePosSubtable.prototype);
  single.getAdjustment = (gid) => (gid === 10 ? { xPlacement: 1, yPlacement: 2, xAdvance: 3, yAdvance: 4 } : null);
  const pair = Object.create(PairPosSubtable.prototype);
  pair.getPairValue = (left, right) => (left === 10 && right === 11 ? {
    v1: { xPlacement: 5, yPlacement: 6, xAdvance: 7, yAdvance: 8 },
    v2: { xPlacement: 9, yPlacement: 10, xAdvance: 11, yAdvance: 12 }
  } : null);

  parser.gpos = { getSubtablesForFeatures: () => [single, pair] };
  parser.gdef = { getGlyphClass: () => 1 };

  const glyphIndices = [10, 11];
  const positioned = glyphIndices.map((glyphIndex) => ({ glyphIndex, xAdvance: 100, xOffset: 0, yOffset: 0, yAdvance: 0 }));
  parser.applyGposPositioning(glyphIndices, positioned, ['kern'], ['DFLT']);
  assert.equal(positioned[0].xOffset, 6);
  assert.equal(positioned[0].yOffset, 8);
  assert.equal(positioned[0].xAdvance, 110);
  assert.equal(positioned[0].yAdvance, 12);
  assert.equal(positioned[1].xOffset, 9);
  assert.equal(positioned[1].yOffset, 10);
  assert.equal(positioned[1].xAdvance, 111);
  assert.equal(positioned[1].yAdvance, 12);
});

test('CffTable.parseCharString handles broad operator sweep including subrs, masks, and seac endchar', () => {
  const cff = Object.create(CffTable.prototype);
  cff.globalSubrs = [Uint8Array.from([149, 149, 5, 11])]; // rlineto + return
  cff.charStrings = [];
  const enc = (n) => {
    assert.ok(n >= -107 && n <= 107);
    return n + 139;
  };
  const nums = (...arr) => arr.map(enc);
  const parse = (bytes, localSubrs = []) => cff.parseCharString(Uint8Array.from(bytes), localSubrs);

  // Core drawing ops, masks, and subr calls.
  const localSubrs = [Uint8Array.from([149, 149, 5, 11])];
  const composite = [
    ...nums(20, 10), 21, // rmoveto
    ...nums(5, 5), 5, // rlineto
    ...nums(4, 3), 6, // hlineto
    ...nums(2, 1), 7, // vlineto
    ...nums(1, 1, 2, 2, 3, 3), 8, // rrcurveto
    ...nums(1, 2, 3, 4, 5, 6, 7, 8), 24, // rcurveline
    ...nums(1, 2, 3, 4, 5, 6, 7, 8), 25, // rlinecurve
    ...nums(1, 2, 3, 4, 5), 26, // vvcurveto (odd count branch)
    ...nums(1, 2, 3, 4, 5), 27, // hhcurveto (odd count branch)
    ...nums(1, 2, 3, 4, 5), 30, // vhcurveto with trailing
    ...nums(1, 2, 3, 4, 5), 31, // hvcurveto with trailing
    ...nums(1, 1), 1, // hstem
    ...nums(1, 1), 19, 0, // hintmask + one mask byte
    ...nums(-107), 10, // callsubr local
    ...nums(-107), 29, // callgsubr global
    ...nums(1, 2, 3, 4, 5, 6, 7), 12, 34, // hflex
    ...nums(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13), 12, 35, // flex
    ...nums(1, 2, 3, 4, 5, 6, 7, 8, 9), 12, 36, // hflex1
    ...nums(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5), 12, 37, // flex1
    14
  ];
  const parsed = parse(composite, localSubrs);
  assert.ok(parsed.points.length > 0);
  assert.ok(parsed.endPts.length > 0);

  // seac-style endchar branch (args length === 5) with base/accent glyph references.
  cff.charStrings[1] = Uint8Array.from([...nums(5, 0), 21, ...nums(5, 5), 5, 14]);
  cff.charStrings[2] = Uint8Array.from([...nums(2, 0), 21, ...nums(2, 2), 5, 14]);
  const seac = parse([...nums(0, 3, 4, 1, 2), 14], localSubrs);
  assert.ok(seac.points.length > 0);
  assert.ok(seac.endPts.length > 0);
});

test('Cff2Table.parseCharString handles operator sweep including vsindex/blend branches', () => {
  const cff2 = Object.create(Cff2Table.prototype);
  cff2.globalSubrs = [Uint8Array.from([149, 149, 5, 11])];
  cff2.charStrings = [];
  cff2.variationCoords = [0.5];
  cff2.vstoreRegionCounts = [1];
  cff2.vstoreRegionIndices = [[0]];
  cff2.vstoreRegions = [[{ start: 0, peak: 1, end: 1 }]];
  const enc = (n) => {
    assert.ok(n >= -107 && n <= 107);
    return n + 139;
  };
  const nums = (...arr) => arr.map(enc);
  const localSubrs = [Uint8Array.from([149, 149, 5, 11])];

  const bytes = Uint8Array.from([
    ...nums(20, 10), 21,
    ...nums(5, 5), 5,
    ...nums(4, 3), 6,
    ...nums(2, 1), 7,
    ...nums(1, 1, 2, 2, 3, 3), 8,
    ...nums(1, 2, 3, 4, 5, 6, 7, 8), 24,
    ...nums(1, 2, 3, 4, 5, 6, 7, 8), 25,
    ...nums(1, 2, 3, 4, 5), 26,
    ...nums(1, 2, 3, 4, 5), 27,
    ...nums(1, 2, 3, 4, 5), 30,
    ...nums(1, 2, 3, 4, 5), 31,
    ...nums(1, 1), 1,
    ...nums(1, 1), 19, 0,
    ...nums(0), 15, // vsindex
    ...nums(10, 20, 1), 16, // blend
    ...nums(0), 12, 16, // escaped vsindex
    ...nums(10, 20, 1), 12, 17, // escaped blend
    ...nums(-107), 10,
    ...nums(-107), 29,
    ...nums(1, 2, 3, 4, 5, 6, 7), 12, 34,
    ...nums(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13), 12, 35,
    ...nums(1, 2, 3, 4, 5, 6, 7, 8, 9), 12, 36,
    ...nums(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5), 12, 37,
    14
  ]);

  const parsed = cff2.parseCharString(bytes, localSubrs);
  assert.ok(parsed.points.length > 0);
  assert.ok(parsed.endPts.length > 0);
});

test('CffTable and Cff2Table flex1 branch handles abs(sumdx) > abs(sumdy) path', () => {
  const enc = (n) => {
    assert.ok(n >= -107 && n <= 107);
    return n + 139;
  };
  const nums = (...arr) => arr.map(enc);
  const flex1DominantX = Uint8Array.from([
    ...nums(10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 5), 12, 37, 14
  ]);

  const cff = Object.create(CffTable.prototype);
  cff.globalSubrs = [];
  cff.charStrings = [];
  assert.doesNotThrow(() => cff.parseCharString(flex1DominantX, []));

  const cff2 = Object.create(Cff2Table.prototype);
  cff2.globalSubrs = [];
  cff2.charStrings = [];
  cff2.variationCoords = [];
  cff2.vstoreRegionCounts = [];
  cff2.vstoreRegionIndices = [];
  cff2.vstoreRegions = [];
  assert.doesNotThrow(() => cff2.parseCharString(flex1DominantX, []));
});

test('Cff2Table debug/trace hooks execute for vsindex/blend and unknown ops', () => {
  const cff2 = Object.create(Cff2Table.prototype);
  cff2.globalSubrs = [];
  cff2.charStrings = [];
  cff2.variationCoords = [0.5];
  cff2.vstoreRegionCounts = [1];
  cff2.vstoreRegionIndices = [[0]];
  cff2.vstoreRegions = [[{ start: 0, peak: 1, end: 1 }]];

  const savedLog = console.log;
  const savedDebug = globalThis.__CFF2_DEBUG;
  const savedTrace = globalThis.__CFF2_TRACE;
  const savedDebugEnabled = Debug.enabled;
  const logs = [];
  try {
    console.log = (...args) => logs.push(args.join(' '));
    Debug.enabled = true;
    globalThis.__CFF2_DEBUG = true;
    globalThis.__CFF2_TRACE = [];
    const enc = (n) => n + 139;
    const bytes = Uint8Array.from([
      enc(0), 15, // vsindex
      enc(10), enc(20), enc(1), 16, // blend
      enc(0), 12, 16, // escaped vsindex
      enc(10), enc(20), enc(1), 12, 17, // escaped blend
      13, // unknown op -> default case
      14
    ]);
    cff2.parseCharString(bytes, []);
    assert.ok(logs.some((l) => l.includes('CFF2 vsindex')));
    assert.ok(logs.length > 0);
    assert.ok(Array.isArray(globalThis.__CFF2_TRACE) && globalThis.__CFF2_TRACE.length > 0);
  } finally {
    console.log = savedLog;
    globalThis.__CFF2_DEBUG = savedDebug;
    globalThis.__CFF2_TRACE = savedTrace;
    Debug.enabled = savedDebugEnabled;
  }
});

test('FontParserTTF gvar applies component transform deltas for composite glyph points', () => {
  const parser = createTtfParserMock();
  parser.variationCoords = [0.5];
  parser.hmtx = {
    getLeftSideBearing: () => 40,
    getAdvanceWidth: () => 600
  };

  const desc = Object.create(GlyfCompositeDescript.prototype);
  Object.assign(desc, {
    getPointCount: () => 3,
    getContourCount: () => 1,
    getEndPtOfContours: () => 2,
    getFlags: () => 1,
    getXCoordinate: (p) => [100, 200, 300][p],
    getYCoordinate: (p) => [10, 20, 30][p],
    getXMaximum: () => 300,
    getXMinimum: () => 100,
    getYMaximum: () => 30,
    getYMinimum: () => 10,
    isComposite: () => true,
    resolve: () => null,
    getComponentForPointIndex: (p) => {
      if (p === 0) return { hasTransform: () => true, transformDelta: (dx, dy) => ({ dx: dx * 2, dy: dy * 3 }) };
      if (p === 1) return { hasTransform: () => false };
      return { hasTransform: () => true, transformDelta: (dx, dy) => ({ dx: dx - 1, dy: dy + 1 }) };
    }
  });

  parser.glyf = { getDescription: () => desc };
  parser.gvar = {
    getDeltasForGlyph: (_gid, _coords, count) => {
      assert.equal(count, 7); // 3 points + 4 phantom points
      return {
        dx: [5, 6, 7, 4, 9], // include phantom lsb/rsb deltas
        dy: [1, 2, 3],
        touched: [true, true, true]
      };
    }
  };

  const glyph = parser.getGlyph(9);
  assert.ok(glyph);
  // point0: transformed (5,1)->(10,3), point1 unchanged (6,2), point2 transformed (7,3)->(6,4)
  assert.equal(glyph.getPoint(0).x, 110);
  assert.equal(glyph.getPoint(0).y, 13);
  assert.equal(glyph.getPoint(1).x, 206);
  assert.equal(glyph.getPoint(1).y, 22);
  assert.equal(glyph.getPoint(2).x, 306);
  assert.equal(glyph.getPoint(2).y, 34);
  // phantom metrics: lsb += 4, advance += (9 - 4)
  assert.equal(glyph.leftSideBearing, 44);
  assert.equal(glyph.advanceWidth, 605);
});

test('FontParserTTF gvar handles sparse composite delta arrays without throwing', () => {
  const parser = createTtfParserMock();
  parser.variationCoords = [0.2];
  parser.hmtx = {
    getLeftSideBearing: () => 10,
    getAdvanceWidth: () => 300
  };

  const desc = Object.create(GlyfCompositeDescript.prototype);
  Object.assign(desc, {
    getPointCount: () => 4,
    getContourCount: () => 1,
    getEndPtOfContours: () => 3,
    getFlags: () => 1,
    getXCoordinate: (p) => [0, 10, 20, 30][p],
    getYCoordinate: (p) => [0, 0, 0, 0][p],
    getXMaximum: () => 30,
    getXMinimum: () => 0,
    getYMaximum: () => 0,
    getYMinimum: () => 0,
    isComposite: () => true,
    resolve: () => null,
    getComponentForPointIndex: () => null
  });
  parser.glyf = { getDescription: () => desc };
  parser.gvar = {
    getDeltasForGlyph: () => ({
      dx: [1], // intentionally short
      dy: [2], // intentionally short
      touched: [] // empty touched map
    })
  };

  assert.doesNotThrow(() => parser.getGlyph(3));
  const glyph = parser.getGlyph(3);
  assert.ok(glyph);
  for (let i = 0; i < glyph.getPointCount(); i++) {
    const p = glyph.getPoint(i);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  }
});

test('FontParserTTF gvar is skipped when variation coords are empty', () => {
  const parser = createTtfParserMock();
  parser.variationCoords = [];
  parser.hmtx = {
    getLeftSideBearing: () => 12,
    getAdvanceWidth: () => 345
  };
  const desc = {
    getPointCount: () => 1,
    getContourCount: () => 1,
    getEndPtOfContours: () => 0,
    getFlags: () => 1,
    getXCoordinate: () => 5,
    getYCoordinate: () => 6,
    getXMaximum: () => 5,
    getXMinimum: () => 5,
    getYMaximum: () => 6,
    getYMinimum: () => 6,
    isComposite: () => false,
    resolve: () => null
  };
  parser.glyf = { getDescription: () => desc };
  let called = false;
  parser.gvar = { getDeltasForGlyph: () => { called = true; return null; } };

  const glyph = parser.getGlyph(1);
  assert.ok(glyph);
  assert.equal(called, false);
  assert.equal(glyph.leftSideBearing, 12);
  assert.equal(glyph.advanceWidth, 345);
});

test('FontParserTTF.getGlyphIndexByChar handles nullish codePointAt result', () => {
  const parser = createTtfParserMock();
  parser.cmap = { getFormat: () => null };
  const weirdChar = { length: 1, codePointAt: () => undefined };
  const gid = parser.getGlyphIndexByChar(weirdChar);
  assert.equal(gid, null);
  const diags = parser.getDiagnostics();
  assert.ok(diags.some((d) => d.code === 'CODE_POINT_RESOLVE_FAILED'));
});

test('FontParserTTF.getGlyphIndexByChar returns null with missing cmap or cmap format', () => {
  const parser = createTtfParserMock();
  parser.cmap = null;
  assert.equal(parser.getGlyphIndexByChar('A'), null);

  parser.cmap = { getFormat: () => null };
  parser.getBestCmapFormatFor = () => null;
  assert.equal(parser.getGlyphIndexByChar('A'), null);

  const diags = parser.getDiagnostics();
  assert.ok(diags.some((d) => d.code === 'MISSING_TABLE_CMAP'));
  assert.ok(diags.some((d) => d.code === 'MISSING_CMAP_FORMAT'));
});

test('SvgTable async fallback returns compressed-null when DecompressionStream is unavailable', async () => {
  const table = Object.create(SvgTable.prototype);
  table.startOffset = 0;
  table.svgDocIndexOffset = 0;
  table.entries = [{ startGlyphId: 1, endGlyphId: 1, svgDocOffset: 0, svgDocLength: 6 }];
  table.view = new DataView(Uint8Array.from([0x1f, 0x8b, 1, 2, 3, 4]).buffer);

  const savedDecompressionStream = globalThis.DecompressionStream;
  try {
    globalThis.DecompressionStream = undefined;
    const res = await table.getSvgDocumentForGlyphAsync(1);
    assert.deepEqual(res, { svgText: null, isCompressed: true });
  } finally {
    globalThis.DecompressionStream = savedDecompressionStream;
  }
});

test('SvgTable async fallback handles null response body without throwing', async () => {
  const table = Object.create(SvgTable.prototype);
  table.startOffset = 0;
  table.svgDocIndexOffset = 0;
  table.entries = [{ startGlyphId: 1, endGlyphId: 1, svgDocOffset: 0, svgDocLength: 6 }];
  table.view = new DataView(Uint8Array.from([0x1f, 0x8b, 1, 2, 3, 4]).buffer);

  const savedDecompressionStream = globalThis.DecompressionStream;
  const savedResponse = globalThis.Response;
  try {
    globalThis.DecompressionStream = class {
      constructor() {}
    };
    globalThis.Response = class {
      constructor() {
        this.body = null;
      }
    };
    const res = await table.getSvgDocumentForGlyphAsync(1);
    assert.deepEqual(res, { svgText: null, isCompressed: true });
  } finally {
    globalThis.DecompressionStream = savedDecompressionStream;
    globalThis.Response = savedResponse;
  }
});
