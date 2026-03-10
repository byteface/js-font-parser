import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';
import { FontParserTTF } from '../dist/data/FontParserTTF.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';
import { TableFactory } from '../dist/table/TableFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = new Set(process.argv.slice(2));
const json = args.has('--json');
const iterations = Math.max(1, Number.parseInt(process.env.PERF_PROFILE_ITERATIONS ?? '8', 10) || 8);

function readFixture(relativePath) {
  return fs.readFileSync(path.resolve(repoRoot, relativePath));
}

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function createCounterMap() {
  return new Map();
}

function recordBucket(map, key, durationMs) {
  const current = map.get(key) ?? { totalMs: 0, count: 0 };
  current.totalMs += durationMs;
  current.count += 1;
  map.set(key, current);
}

function formatTableTag(tag) {
  if (typeof tag === 'string') return tag;
  if (typeof tag !== 'number' || !Number.isFinite(tag)) return 'unknown';
  return String.fromCharCode(
    (tag >>> 24) & 0xff,
    (tag >>> 16) & 0xff,
    (tag >>> 8) & 0xff,
    tag & 0xff
  );
}

function withTimingPatch(target, methodName, labelFactory, callback) {
  const original = target[methodName];
  target[methodName] = function patched(...methodArgs) {
    const start = performance.now();
    try {
      return original.apply(this, methodArgs);
    } finally {
      callback(labelFactory(methodArgs, this), performance.now() - start);
    }
  };
  return () => {
    target[methodName] = original;
  };
}

function sortBuckets(map) {
  return [...map.entries()]
    .map(([name, stat]) => ({
      name,
      totalMs: stat.totalMs,
      count: stat.count,
      avgMs: stat.totalMs / stat.count
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
}

function formatRows(rows, limit = 12) {
  return rows.slice(0, limit).map((row) =>
    `${row.name.padEnd(30)} total ${row.totalMs.toFixed(2).padStart(8)} ms ` +
    `avg ${row.avgMs.toFixed(2).padStart(7)} ms count ${String(row.count).padStart(4)}`
  );
}

function profileParse(fontPath) {
  const tableBuckets = createCounterMap();
  const methodBuckets = createCounterMap();
  const bytes = readFixture(fontPath);

  const unpatches = [
    withTimingPatch(
      TableFactory.prototype,
      'create',
      ([entry]) => `table:${formatTableTag(entry?.tag ?? entry?.getTag?.() ?? 'unknown')}`,
      (label, durationMs) => recordBucket(tableBuckets, label, durationMs)
    ),
    withTimingPatch(
      FontParserTTF.prototype,
      'getTable',
      ([tableType]) => `ttf:getTable:${formatTableTag(tableType)}`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      FontParserWOFF.prototype,
      'getTable',
      ([tableType]) => `woff:getTable:${formatTableTag(tableType)}`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    )
  ];

  const totals = [];
  try {
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      FontParser.fromArrayBuffer(toArrayBuffer(bytes));
      totals.push(performance.now() - start);
    }
  } finally {
    for (const unpatch of unpatches.reverse()) unpatch();
  }

  return {
    fontPath,
    avgTotalMs: totals.reduce((sum, value) => sum + value, 0) / totals.length,
    maxTotalMs: Math.max(...totals),
    tableRows: sortBuckets(tableBuckets),
    methodRows: sortBuckets(methodBuckets)
  };
}

function profileLayout(fontPath, text, options) {
  const methodBuckets = createCounterMap();
  const bytes = readFixture(fontPath);
  const font = FontParser.fromArrayBuffer(toArrayBuffer(bytes));

  const proto = font instanceof FontParserWOFF ? FontParserWOFF.prototype : FontParserTTF.prototype;
  const className = font instanceof FontParserWOFF ? 'woff' : 'ttf';

  const unpatches = [
    withTimingPatch(
      proto,
      'getGlyphIndicesForStringWithGsub',
      () => `${className}:gsub`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'getGlyph',
      () => `${className}:getGlyph`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'getKerningValueByGlyphs',
      () => `${className}:kern`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'getGposKerningValueByGlyphs',
      () => `${className}:gposKern`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'getMarkAnchorsForGlyph',
      () => `${className}:anchors`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'applyGposPositioning',
      () => `${className}:applyGpos`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    ),
    withTimingPatch(
      proto,
      'layoutString',
      () => `${className}:layoutString`,
      (label, durationMs) => recordBucket(methodBuckets, label, durationMs)
    )
  ];

  const totals = [];
  try {
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      font.layoutString(text, options);
      totals.push(performance.now() - start);
    }
  } finally {
    for (const unpatch of unpatches.reverse()) unpatch();
  }

  return {
    fontPath,
    text,
    avgTotalMs: totals.reduce((sum, value) => sum + value, 0) / totals.length,
    maxTotalMs: Math.max(...totals),
    methodRows: sortBuckets(methodBuckets)
  };
}

const parseProfiles = [
  profileParse('truetypefonts/noto/NotoSans-Regular.ttf'),
  profileParse('truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf')
];

const layoutProfiles = [
  profileLayout('truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf', 'پاکستان اردو خوشی', {
    gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
    scriptTags: ['arab', 'DFLT'],
    gpos: true,
    gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
  }),
  profileLayout('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf', 'श्रृंखला संस्कृत प्रार्थना', {
    gsubFeatures: ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
    scriptTags: ['deva', 'DFLT'],
    gpos: true,
    gposFeatures: ['kern', 'mark', 'mkmk']
  })
];

if (json) {
  process.stdout.write(`${JSON.stringify({ iterations, parseProfiles, layoutProfiles }, null, 2)}\n`);
  process.exit(0);
}

console.log(`Performance hotspot profile (${iterations} iterations)`);
console.log('');

for (const profile of parseProfiles) {
  console.log(`Parse profile: ${profile.fontPath}`);
  console.log(`  avg total ${profile.avgTotalMs.toFixed(2)} ms, max ${profile.maxTotalMs.toFixed(2)} ms`);
  console.log('  top table creation buckets:');
  for (const row of formatRows(profile.tableRows, 8)) console.log(`    ${row}`);
  if (profile.methodRows.length > 0) {
    console.log('  top constructor/helper buckets:');
    for (const row of formatRows(profile.methodRows, 6)) console.log(`    ${row}`);
  }
  console.log('');
}

for (const profile of layoutProfiles) {
  console.log(`Layout profile: ${profile.fontPath}`);
  console.log(`  text: ${profile.text}`);
  console.log(`  avg total ${profile.avgTotalMs.toFixed(2)} ms, max ${profile.maxTotalMs.toFixed(2)} ms`);
  console.log('  top layout buckets:');
  for (const row of formatRows(profile.methodRows, 10)) console.log(`    ${row}`);
  console.log('');
}
