import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FontParser, setWoff2Decoder, setWoff2DecoderAsync } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readBytes(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  return fs.readFileSync(fullPath);
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

test('WOFF2 smoke fixture path is parseable with injected sync decoder', () => {
  const woff2Bytes = readBytes('truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2');
  const ttfBytes = new Uint8Array(readBytes('truetypefonts/noto/NotoSans-Regular.ttf'));
  assert.equal(String.fromCharCode(woff2Bytes[0], woff2Bytes[1], woff2Bytes[2], woff2Bytes[3]), 'wOF2');

  try {
    setWoff2DecoderAsync(null);
    setWoff2Decoder(() => ttfBytes);
    const font = FontParser.fromArrayBuffer(toArrayBuffer(woff2Bytes));
    assert.ok(font.getGlyphIndexByChar('H') > 0);
  } finally {
    setWoff2Decoder(null);
    setWoff2DecoderAsync(null);
  }
});

test('FontParser.load can decode WOFF2 through async decoder hook', async () => {
  const savedFetch = globalThis.fetch;
  const woff2Bytes = readBytes('truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2');
  const ttfBytes = new Uint8Array(readBytes('truetypefonts/noto/NotoSans-Regular.ttf'));

  try {
    setWoff2Decoder(null);
    setWoff2DecoderAsync(async () => ttfBytes);
    globalThis.fetch = async () => ({
      ok: true,
      arrayBuffer: async () => toArrayBuffer(woff2Bytes)
    });
    const font = await FontParser.load('https://example.test/smoke.woff2');
    assert.ok(font.getGlyphIndexByChar('H') > 0);
  } finally {
    globalThis.fetch = savedFetch;
    setWoff2Decoder(null);
    setWoff2DecoderAsync(null);
  }
});
