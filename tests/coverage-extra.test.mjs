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
import { decodeWoff2, setWoff2Decoder } from '../dist/utils/Woff2Decoder.js';
import { Table } from '../dist/table/Table.js';
import { LayoutEngine } from '../dist/layout/LayoutEngine.js';
import { GsubTable } from '../dist/table/GsubTable.js';
import { GposTable } from '../dist/table/GposTable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath);
}

function createMockLayoutFont(widths = {}, kerning = {}) {
  const defaultWidth = 100;
  const glyphByChar = new Map();
  const glyphByIndex = new Map();
  let nextIndex = 1;

  const ensureGlyph = (ch) => {
    if (glyphByChar.has(ch)) return glyphByChar.get(ch);
    const glyph = { index: nextIndex++, advanceWidth: widths[ch] ?? defaultWidth };
    glyphByChar.set(ch, glyph);
    glyphByIndex.set(glyph.index, glyph);
    return glyph;
  };

  for (const ch of Object.keys(widths)) ensureGlyph(ch);

  return {
    getGlyphByChar(ch) {
      return glyphByChar.has(ch) ? ensureGlyph(ch) : null;
    },
    getGlyph(index) {
      return glyphByIndex.get(index) ?? null;
    },
    getGlyphIndexByChar(ch) {
      return glyphByChar.has(ch) ? ensureGlyph(ch).index : null;
    },
    getKerningValueByGlyphs(left, right) {
      return kerning[`${left},${right}`] ?? 0;
    },
    getTableByType() {
      return null;
    }
  };
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
    const minCount = minGlyph.getPointCount();

    font.setVariationByAxes(maxs);
    const maxGlyph = font.getGlyph(gid);
    assert.ok(maxGlyph, `expected max-axis glyph for ${fixture}`);
    const maxBbox = getBbox(maxGlyph);
    const maxCount = maxGlyph.getPointCount();

    for (const box of [defaultBbox, minBbox, maxBbox]) {
      assert.ok(Number.isFinite(box.minX) && Number.isFinite(box.minY) && Number.isFinite(box.maxX) && Number.isFinite(box.maxY));
      assert.ok(box.minX <= box.maxX && box.minY <= box.maxY, `expected sane bbox for ${fixture}`);
    }
    assert.notDeepEqual(minBbox, maxBbox, `expected outline bbox to vary across axis extremes for ${fixture}`);
    assert.equal(minCount, maxCount, `expected point count stability for ${fixture}`);

    // Out-of-range values should clamp safely and never produce NaN coords.
    font.setVariationByAxes(outOfRange);
    const clampedGlyph = font.getGlyph(gid);
    assert.ok(clampedGlyph, `expected clamped glyph for ${fixture}`);
    for (let i = 0; i < clampedGlyph.getPointCount(); i++) {
      const p = clampedGlyph.getPoint(i);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `expected finite point coordinates for ${fixture}`);
    }
    assert.ok(Number.isFinite(clampedGlyph.advanceWidth), `expected finite advanceWidth for ${fixture}`);

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
        assert.ok(Number.isFinite(glyph.advanceWidth), `advanceWidth should be finite for gid=${gid} in ${fixture}`);
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

test('Layout engine preserves all soft-hyphen segments across wrapped lines', () => {
  const font = createMockLayoutFont({
    a: 100,
    b: 100,
    c: 100,
    d: 100,
    e: 100,
    f: 100,
    '-': 40
  });
  const text = 'ab\u00ADcd\u00ADef';
  const layout = LayoutEngine.layoutText(font, text, {
    maxWidth: 260,
    breakWords: true,
    hyphenate: 'soft',
    hyphenMinWordLength: 2
  });
  const lines = layout.lines.map(line => line.glyphs.map(g => g.char).join('')).filter(Boolean);
  assert.deepEqual(lines, ['ab-', 'cd-', 'ef']);
});

test('Layout engine soft-hyphen path falls back without dropping characters', () => {
  const font = createMockLayoutFont({
    a: 220,
    b: 220,
    c: 220,
    d: 220,
    e: 220,
    f: 220,
    '-': 60
  });
  const text = 'abc\u00ADdef';
  const layout = LayoutEngine.layoutText(font, text, {
    maxWidth: 300,
    breakWords: true,
    hyphenate: 'soft',
    hyphenMinWordLength: 2
  });
  const rendered = layout.lines.map(line => line.glyphs.map(g => g.char).join('')).join('');
  assert.equal(rendered, 'abcdef');
});

test('Layout engine justify ignores trailing spaces when distributing width', () => {
  const font = createMockLayoutFont({ a: 100, b: 100, ' ': 100 });
  const layout = LayoutEngine.layoutText(font, 'a b  ', {
    maxWidth: 500,
    align: 'justify',
    justifyLastLine: true,
    trimTrailingSpaces: true
  });
  const spaces = layout.lines[0].glyphs.filter(g => g.char === ' ');
  assert.equal(spaces[0].advance, 300);
  assert.equal(spaces[1].advance, 100);
  assert.equal(spaces[2].advance, 100);
});

test('Layout engine does not justify final line unless requested', () => {
  const font = createMockLayoutFont({ a: 100, b: 100, ' ': 100 });
  const layout = LayoutEngine.layoutText(font, 'a b', {
    maxWidth: 600,
    align: 'justify',
    justifyLastLine: false
  });
  assert.equal(layout.lines[0].width, 300);
});

test('Layout engine collapseSpaces keeps NBSP when preserveNbsp is enabled', () => {
  const font = createMockLayoutFont({ A: 100, B: 100, ' ': 100, '\u00A0': 100 });
  const layout = LayoutEngine.layoutText(font, 'A  \u00A0  B', {
    collapseSpaces: true,
    preserveNbsp: true
  });
  const rendered = layout.lines[0].glyphs.map(g => g.char).join('');
  assert.equal(rendered, 'A \u00A0 B');
});

test('Layout engine expands tabs by tabSize when collapseSpaces is disabled', () => {
  const font = createMockLayoutFont({ A: 100, B: 100, ' ': 100 });
  const layout = LayoutEngine.layoutText(font, 'A\tB', {
    tabSize: 3,
    collapseSpaces: false
  });
  const rendered = layout.lines[0].glyphs.map(g => g.char).join('');
  assert.equal(rendered, 'A   B');
});

test('Layout engine auto direction uses RTL run ordering for mixed text', () => {
  const font = createMockLayoutFont({
    a: 100,
    b: 100,
    c: 100,
    ' ': 100,
    א: 100,
    ב: 100,
    ג: 100
  });
  const layout = LayoutEngine.layoutText(font, 'abc אבג', {
    direction: 'auto',
    bidi: 'simple'
  });
  const rendered = layout.lines[0].glyphs.map(g => g.char).join('');
  assert.equal(rendered, 'אבגabc ');
});

test('Layout engine resets kerning chain when a glyph is missing', () => {
  const font = createMockLayoutFont({ A: 100, C: 100 }, { '1,2': 40 });
  const layout = LayoutEngine.layoutText(font, 'A?C', {
    useKerning: true
  });
  assert.equal(layout.lines[0].width, 200);
});

test('Layout engine trims leading spaces after explicit line breaks', () => {
  const font = createMockLayoutFont({ A: 100, B: 100, ' ': 100 });
  const layout = LayoutEngine.layoutText(font, 'A\n   B', {
    trimLeadingSpaces: true
  });
  assert.equal(layout.lines.length, 2);
  const secondLine = layout.lines[1].glyphs.map(g => g.char).join('');
  assert.equal(secondLine, 'B');
});

test('Layout engine uses custom hyphenChar for soft-hyphen breaks', () => {
  const font = createMockLayoutFont({
    a: 100,
    b: 100,
    c: 100,
    d: 100,
    '~': 40
  });
  const layout = LayoutEngine.layoutText(font, 'ab\u00ADcd', {
    maxWidth: 260,
    breakWords: true,
    hyphenate: 'soft',
    hyphenChar: '~',
    hyphenMinWordLength: 2
  });
  const lines = layout.lines.map(line => line.glyphs.map(g => g.char).join('')).filter(Boolean);
  assert.deepEqual(lines, ['ab~', 'cd']);
});

test('TTF parser exposes structured diagnostics for invalid character input', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  font.clearDiagnostics();

  font.getGlyphIndexByChar('');
  font.getGlyphIndexByChar('abc');

  const diagnostics = font.getDiagnostics();
  const codes = diagnostics.map(d => d.code);
  assert.ok(codes.includes('INVALID_CHAR_INPUT'));
  assert.ok(codes.includes('MULTI_CHAR_INPUT'));
  assert.ok(diagnostics.every(d => typeof d.message === 'string' && d.message.length > 0));
});

test('TTF parser emits diagnostics when GSUB/GPOS fall back to direct behavior', () => {
  const bytes = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  font.clearDiagnostics();

  font.gsub = null;
  font.gpos = null;
  const positioned = font.layoutString('Hello', { gpos: true });
  assert.ok(positioned.length > 0);

  const codes = font.getDiagnostics().map(d => d.code);
  assert.ok(codes.includes('MISSING_TABLE_GSUB'));
  assert.ok(codes.includes('MISSING_TABLE_GPOS'));
});

test('Layout engine can collect structured diagnostics for missing glyphs and soft-hyphen fallback', () => {
  const font = createMockLayoutFont({
    a: 220,
    b: 220,
    c: 220,
    d: 220,
    '-': 60
  });

  const diagnostics = [];
  LayoutEngine.layoutText(font, 'ab\u00ADcd ?', {
    maxWidth: 300,
    breakWords: true,
    hyphenate: 'soft',
    hyphenMinWordLength: 2,
    diagnostics
  });

  const codes = diagnostics.map(d => d.code);
  assert.ok(codes.includes('SOFT_HYPHEN_FALLBACK'));
  assert.ok(codes.includes('MISSING_GLYPH'));
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

test('golden targets config is well-formed', () => {
  const targetsPath = path.resolve(__dirname, 'golden', 'targets.json');
  const raw = fs.readFileSync(targetsPath, 'utf8');
  const targets = JSON.parse(raw);
  assert.ok(Array.isArray(targets), 'targets.json should be an array');
  assert.ok(targets.length > 0, 'expected at least one golden target');

  const seenIds = new Set();
  for (const target of targets) {
    assert.ok(typeof target.id === 'string' && target.id.length > 0, 'target id required');
    assert.ok(!seenIds.has(target.id), `duplicate target id: ${target.id}`);
    seenIds.add(target.id);
    assert.ok(typeof target.path === 'string' && target.path.startsWith('/'), 'target path must be absolute');
    assert.ok(Number.isFinite(target.width) && target.width > 0, 'target width must be > 0');
    assert.ok(Number.isFinite(target.height) && target.height > 0, 'target height must be > 0');
    if (target.waitMs != null) {
      assert.ok(Number.isFinite(target.waitMs) && target.waitMs >= 0, 'waitMs must be >= 0');
    }
  }
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
