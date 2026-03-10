import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const budgets = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'perf-budgets.json'), 'utf8'));

const args = new Set(process.argv.slice(2));
const enforce = args.has('--enforce');
const json = args.has('--json');
const iterations = Math.max(1, Number.parseInt(process.env.PERF_ITERATIONS ?? '20', 10) || 20);
const warmupIterations = Math.max(0, Number.parseInt(process.env.PERF_WARMUP ?? '5', 10) || 5);

function readFixture(relativePath) {
  return fs.readFileSync(path.resolve(repoRoot, relativePath));
}

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function benchmark(fn) {
  for (let i = 0; i < warmupIterations; i++) fn();

  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    samples.push(duration);
    if (result === false) {
      throw new Error('Performance operation returned failure sentinel.');
    }
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    avgMs: total / samples.length,
    minMs: Math.min(...samples),
    maxMs: Math.max(...samples),
    iterations: samples.length
  };
}

const parseNotoBytes = readFixture('truetypefonts/noto/NotoSans-Regular.ttf');
const parseUbuntuWoffBytes = readFixture('truetypefonts/ubuntu.woff');
const parseCjkOtfBytes = readFixture('truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf');
const urduBytes = readFixture('truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf');
const devaBytes = readFixture('truetypefonts/curated-extra/NotoSansDevanagari-VF.ttf');
const bengBytes = readFixture('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');
const serifVarBytes = readFixture('truetypefonts/curated/SourceSerif4Variable-Roman.otf');

const urduFont = FontParser.fromArrayBuffer(toArrayBuffer(urduBytes));
const devaFont = FontParser.fromArrayBuffer(toArrayBuffer(devaBytes));
const bengFont = FontParser.fromArrayBuffer(toArrayBuffer(bengBytes));
const serifVarFont = FontParser.fromArrayBuffer(toArrayBuffer(serifVarBytes));

const operations = [
  {
    name: 'parse-noto-ttf',
    description: 'Parse regular Latin TTF fixture',
    budgetMs: budgets['parse-noto-ttf'],
    run: () => FontParser.fromArrayBuffer(toArrayBuffer(parseNotoBytes))
  },
  {
    name: 'parse-ubuntu-woff',
    description: 'Parse legacy WOFF fixture',
    budgetMs: budgets['parse-ubuntu-woff'],
    run: () => FontParser.fromArrayBuffer(toArrayBuffer(parseUbuntuWoffBytes))
  },
  {
    name: 'parse-cjk-otf',
    description: 'Parse large Korean CJK OTF fixture',
    budgetMs: budgets['parse-cjk-otf'],
    run: () => FontParser.fromArrayBuffer(toArrayBuffer(parseCjkOtfBytes))
  },
  {
    name: 'layout-urdu-gpos',
    description: 'Shape + position Nastaliq Urdu with GSUB/GPOS',
    budgetMs: budgets['layout-urdu-gpos'],
    run: () => urduFont.layoutString('پاکستان اردو خوشی', {
      gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
      scriptTags: ['arab', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
    }).length > 0
  },
  {
    name: 'layout-deva-gpos',
    description: 'Shape + position Devanagari with marks',
    budgetMs: budgets['layout-deva-gpos'],
    run: () => devaFont.layoutString('श्रृंखला संस्कृत प्रार्थना', {
      gsubFeatures: ['locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'abvf', 'half', 'pstf', 'cjct'],
      scriptTags: ['deva', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    }).length > 0
  },
  {
    name: 'layout-beng-gpos',
    description: 'Shape + position Bengali with marks',
    budgetMs: budgets['layout-beng-gpos'],
    run: () => bengFont.layoutString('বাংলা কীর্তি শ্রদ্ধা', {
      gsubFeatures: ['locl', 'ccmp', 'nukt', 'akhn'],
      scriptTags: ['beng', 'DFLT'],
      gpos: true,
      gposFeatures: ['kern', 'mark', 'mkmk']
    }).length > 0
  },
  {
    name: 'variation-source-serif',
    description: 'Toggle variation axes and resolve a glyph',
    budgetMs: budgets['variation-source-serif'],
    run: () => {
      serifVarFont.setVariationByAxes({ wght: 200 });
      serifVarFont.getGlyph(36);
      serifVarFont.setVariationByAxes({ wght: 900 });
      return serifVarFont.getGlyph(36);
    }
  }
];

const results = operations.map((operation) => {
  const summary = benchmark(operation.run);
  const overBudget = summary.avgMs > operation.budgetMs;
  return {
    ...operation,
    ...summary,
    overBudget
  };
}).sort((a, b) => b.avgMs - a.avgMs);

if (json) {
  process.stdout.write(`${JSON.stringify({
    iterations,
    warmupIterations,
    enforce,
    results
  }, null, 2)}\n`);
} else {
  console.log(`Performance report (${iterations} iterations, ${warmupIterations} warmups)`);
  console.log('');
  for (const result of results) {
    const status = result.overBudget ? 'OVER' : 'OK';
    console.log(
      `${status.padEnd(4)} ${result.name.padEnd(24)} avg ${formatMs(result.avgMs).padStart(9)} ` +
      `min ${formatMs(result.minMs).padStart(9)} max ${formatMs(result.maxMs).padStart(9)} ` +
      `budget ${formatMs(result.budgetMs).padStart(9)}`
    );
    console.log(`     ${result.description}`);
  }
}

const failed = results.filter((result) => result.overBudget);
if (enforce && failed.length > 0) {
  console.error('');
  console.error(`Performance budgets exceeded for: ${failed.map((result) => result.name).join(', ')}`);
  process.exitCode = 1;
}
