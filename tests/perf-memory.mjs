import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { FontParser } from '../dist/data/FontParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

if (typeof global.gc !== 'function') {
  console.error('Memory report requires --expose-gc.');
  process.exit(1);
}

function readFixture(relativePath) {
  return fs.readFileSync(path.resolve(repoRoot, relativePath));
}

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function heapUsedMb() {
  return process.memoryUsage().heapUsed / (1024 * 1024);
}

function collect() {
  global.gc();
  global.gc();
}

function fmt(value) {
  return `${value.toFixed(2)} MB`;
}

function runScenario(name, description, fn) {
  collect();
  const before = heapUsedMb();
  fn();
  collect();
  const after = heapUsedMb();
  return {
    name,
    description,
    beforeMb: before,
    afterMb: after,
    retainedMb: after - before
  };
}

const cjkBytes = readFixture('truetypefonts/curated-extra/NotoSansCJKkr-Regular.otf');
const urduBytes = readFixture('truetypefonts/curated-extra/NotoNastaliqUrdu-VF.ttf');
const bengBytes = readFixture('truetypefonts/curated-extra/NotoSansBengali-VF.ttf');

const results = [
  runScenario(
    'repeat-parse-cjk-otf',
    'Parse a large CJK OTF repeatedly and release instances',
    () => {
      for (let i = 0; i < 12; i++) {
        const font = FontParser.fromArrayBuffer(toArrayBuffer(cjkBytes));
        font.getGlyph(100 + i);
      }
    }
  ),
  runScenario(
    'repeat-layout-urdu',
    'Reuse one Urdu font and shape many distinct strings to exercise GSUB/GPOS caches',
    () => {
      const font = FontParser.fromArrayBuffer(toArrayBuffer(urduBytes));
      for (let i = 0; i < 160; i++) {
        font.layoutString(`پاکستان اردو خوشی ${i}`, {
          gsubFeatures: ['ccmp', 'locl', 'isol', 'fina', 'init', 'medi', 'rlig', 'liga', 'calt'],
          scriptTags: ['arab', 'DFLT'],
          gpos: true,
          gposFeatures: ['kern', 'mark', 'mkmk', 'curs']
        });
      }
    }
  ),
  runScenario(
    'repeat-layout-bengali',
    'Reuse one Bengali font and shape many distinct strings to exercise mark caches',
    () => {
      const font = FontParser.fromArrayBuffer(toArrayBuffer(bengBytes));
      for (let i = 0; i < 160; i++) {
        font.layoutString(`বাংলা কীর্তি শ্রদ্ধা ${i}`, {
          gsubFeatures: ['locl', 'ccmp', 'nukt', 'akhn'],
          scriptTags: ['beng', 'DFLT'],
          gpos: true,
          gposFeatures: ['kern', 'mark', 'mkmk']
        });
      }
    }
  )
];

console.log('Memory retention report (post-GC retained heap)');
console.log('');
for (const result of results) {
  console.log(
    `${result.name.padEnd(24)} before ${fmt(result.beforeMb).padStart(9)} ` +
    `after ${fmt(result.afterMb).padStart(9)} retained ${fmt(result.retainedMb).padStart(9)}`
  );
  console.log(`  ${result.description}`);
}
