import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FontParser } from '../dist/data/FontParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return new Uint8Array(fs.readFileSync(fullPath));
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function mutateBytes(base, rand) {
  const op = randInt(rand, 0, 6);
  const copy = new Uint8Array(base);
  if (copy.length === 0) return copy;

  if (op === 0) {
    const idx = randInt(rand, 0, copy.length - 1);
    copy[idx] = (copy[idx] + randInt(rand, 1, 255)) & 0xff;
    return copy;
  }

  if (op === 1) {
    const count = Math.max(1, Math.floor(copy.length * 0.02));
    for (let i = 0; i < count; i++) {
      const idx = randInt(rand, 0, copy.length - 1);
      copy[idx] = randInt(rand, 0, 255);
    }
    return copy;
  }

  if (op === 2) {
    const newLen = randInt(rand, 0, Math.max(0, copy.length - 1));
    return copy.subarray(0, newLen);
  }

  if (op === 3) {
    const extraLen = randInt(rand, 1, 256);
    const out = new Uint8Array(copy.length + extraLen);
    out.set(copy, 0);
    for (let i = copy.length; i < out.length; i++) out[i] = randInt(rand, 0, 255);
    return out;
  }

  if (op === 4) {
    for (let i = 0; i < Math.min(12, copy.length); i++) {
      copy[i] = randInt(rand, 0, 255);
    }
    return copy;
  }

  if (op === 5) {
    if (copy.length > 16) {
      // Flip common length fields (sfnt/woff headers) into suspicious values.
      const fields = [8, 12, 16];
      for (const offset of fields) {
        if (offset + 3 >= copy.length) continue;
        copy[offset] = 0xff;
        copy[offset + 1] = 0xff;
        copy[offset + 2] = 0xff;
        copy[offset + 3] = 0xff;
      }
    }
    return copy;
  }

  const a = randInt(rand, 0, copy.length - 1);
  const b = randInt(rand, a, copy.length - 1);
  const c = randInt(rand, 0, copy.length - 1);
  const d = randInt(rand, c, copy.length - 1);
  const left = copy.subarray(0, a);
  const mid = copy.subarray(c, d + 1);
  const right = copy.subarray(b + 1);
  const out = new Uint8Array(left.length + mid.length + right.length);
  out.set(left, 0);
  out.set(mid, left.length);
  out.set(right, left.length + mid.length);
  return out;
}

function parseMustTerminateQuickly(bytes, maxMs) {
  const start = Date.now();
  let parser = null;
  try {
    parser = FontParser.fromArrayBuffer(toArrayBuffer(bytes));
  } catch {
    // expected for malformed data
  }
  const elapsed = Date.now() - start;
  assert.ok(elapsed < maxMs, `parse took too long: ${elapsed}ms`);
  if (parser) {
    // If parse succeeds on fuzzed bytes, basic API calls should still be safe.
    assert.doesNotThrow(() => parser.getNumGlyphs());
    assert.doesNotThrow(() => parser.getAscent());
  }
}

test('fuzz hardening: mutated TTF and OTF inputs parse-or-throw quickly', { timeout: 30000 }, () => {
  const ttfBase = readBytes('truetypefonts/noto/NotoSans-Regular.ttf');
  const otfBase = readBytes('truetypefonts/curated-extra/SourceCodePro-Regular.otf');
  const rand = mulberry32(0xA11CE);

  for (let i = 0; i < 24; i++) {
    parseMustTerminateQuickly(mutateBytes(ttfBase, rand), 3000);
    parseMustTerminateQuickly(mutateBytes(otfBase, rand), 3000);
  }
});

test('fuzz hardening: mutated WOFF inputs parse-or-throw quickly', { timeout: 30000 }, () => {
  const woffBase = readBytes('truetypefonts/curated-extra/FiraSans-Regular.woff');
  const rand = mulberry32(0xBADC0DE);

  for (let i = 0; i < 36; i++) {
    parseMustTerminateQuickly(mutateBytes(woffBase, rand), 3000);
  }
});

test('fuzz hardening: random small buffers never hang parser entrypoint', { timeout: 30000 }, () => {
  const rand = mulberry32(0xC0FFEE);
  for (let i = 0; i < 64; i++) {
    const len = randInt(rand, 0, 256);
    const bytes = new Uint8Array(len);
    for (let j = 0; j < len; j++) bytes[j] = randInt(rand, 0, 255);
    parseMustTerminateQuickly(bytes, 300);
  }
});
