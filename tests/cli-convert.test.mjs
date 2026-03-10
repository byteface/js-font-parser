import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  convertSfntToWoff,
  convertWoffToSfnt,
  detectInputType,
  detectSfntKind,
  defaultSfntExtension,
  resolveConvertOutPath,
  asArrayBuffer
} from '../proj/fontparser/commands/convert.mjs';
import { FontParser } from '../dist/data/FontParser.js';
import { FontParserWOFF } from '../dist/data/FontParserWOFF.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readFixture(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath));
}

test('CLI convert: TTF -> WOFF -> SFNT preserves readability', () => {
  const ttf = readFixture('truetypefonts/curated/FiraSans-Regular.ttf');
  const woff = convertSfntToWoff(ttf);
  assert.equal(detectInputType(woff), 'woff');

  const woffParsed = FontParser.fromArrayBuffer(asArrayBuffer(woff));
  assert.ok(woffParsed instanceof FontParserWOFF);

  const sfnt = convertWoffToSfnt(woff);
  assert.equal(detectInputType(sfnt), 'sfnt');

  const parsed = FontParser.fromArrayBuffer(asArrayBuffer(sfnt));
  assert.ok(parsed.getNumGlyphs() > 0);
  assert.ok(parsed.getGlyphIndexByChar('A') > 0);
});

test('CLI convert: OTF -> WOFF -> SFNT preserves OTTO flavor', () => {
  const otf = readFixture('truetypefonts/curated/SourceSerif4-Regular.otf');
  const woff = convertSfntToWoff(otf);
  const sfnt = convertWoffToSfnt(woff);

  assert.equal(defaultSfntExtension(sfnt), '.otf');

  const parsed = FontParser.fromArrayBuffer(asArrayBuffer(sfnt));
  assert.ok(parsed.getNumGlyphs() > 0);
  assert.ok(parsed.getGlyphByChar('A'));
});

test('CLI convert: output path resolver chooses expected extensions', () => {
  const ttf = readFixture('truetypefonts/curated/FiraSans-Regular.ttf');
  const woff = convertSfntToWoff(ttf);
  const sfnt = convertWoffToSfnt(woff);

  const woffPath = resolveConvertOutPath('/tmp/my-font.ttf', 'woff');
  assert.equal(path.extname(woffPath), '.woff');

  const sfntPath = resolveConvertOutPath('/tmp/my-font.woff', 'sfnt', null, sfnt);
  assert.equal(path.extname(sfntPath), '.ttf');
});

test('CLI convert: rejects malformed WOFF input', () => {
  const bad = Buffer.from([0x77, 0x4F, 0x46, 0x46, 0x00]);
  assert.throws(() => convertWoffToSfnt(bad), /Invalid WOFF input|header|too short/i);
});

test('CLI convert: input type detection distinguishes WOFF1 and WOFF2', () => {
  const woff1 = Buffer.from([0x77, 0x4F, 0x46, 0x46, 0, 0, 0, 0]);
  const woff2 = Buffer.from([0x77, 0x4F, 0x46, 0x32, 0, 0, 0, 0]);
  assert.equal(detectInputType(woff1), 'woff');
  assert.equal(detectInputType(woff2), 'woff2');
});

test('CLI convert: sfnt kind detection identifies TTF and OTF', () => {
  const ttf = readFixture('truetypefonts/curated/FiraSans-Regular.ttf');
  const otf = readFixture('truetypefonts/curated/SourceSerif4-Regular.otf');
  assert.equal(detectSfntKind(ttf), 'ttf');
  assert.equal(detectSfntKind(otf), 'otf');
});
