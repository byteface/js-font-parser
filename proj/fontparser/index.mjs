import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ByteArray } from "../../dist/utils/ByteArray.js";
import { FontParserTTF } from "../../dist/data/FontParserTTF.js";
import { Table } from "../../dist/table/Table.js";
import { getSupportedLanguages, supportsLanguage } from "../../dist/utils/LanguageSupport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

function loadFont(pathLike) {
  const data = fs.readFileSync(pathLike);
  return new FontParserTTF(new ByteArray(new Uint8Array(data)));
}

function printCoverage(font) {
  const rows = getSupportedLanguages(font);
  rows.forEach(r => {
    const pct = Math.round(r.coverage * 100);
    const status = r.supported ? "yes" : "no";
    const missing = r.missing.slice(0, 12).join("");
    console.log(`${r.code.padEnd(4)} ${r.name.padEnd(24)} ${status.padEnd(4)} ${String(pct).padStart(3)}%  ${missing}`);
  });
}

function updateNameTableBuffer(fontBuffer, newSuffix) {
  const view = new DataView(fontBuffer.buffer, fontBuffer.byteOffset, fontBuffer.byteLength);
  const numTables = view.getUint16(4);
  let offset = 12;
  let headOffset = 0;
  let headLength = 0;
  let nameOffset = 0;
  let nameLength = 0;
  const records = [];

  for (let i = 0; i < numTables; i++) {
    const tag = view.getUint32(offset);
    const checkSum = view.getUint32(offset + 4);
    const tableOffset = view.getUint32(offset + 8);
    const tableLength = view.getUint32(offset + 12);
    records.push({ tag, checkSum, tableOffset, tableLength, recordOffset: offset });
    if (tag === Table.head) {
      headOffset = tableOffset;
      headLength = tableLength;
    }
    if (tag === Table.pName) {
      nameOffset = tableOffset;
      nameLength = tableLength;
    }
    offset += 16;
  }

  if (!nameOffset) {
    throw new Error("No name table found");
  }

  const nameView = new DataView(fontBuffer.buffer, fontBuffer.byteOffset + nameOffset, nameLength);
  const format = nameView.getUint16(0);
  const count = nameView.getUint16(2);
  const stringOffset = nameView.getUint16(4);
  const stringsStart = nameOffset + stringOffset;

  for (let i = 0; i < count; i++) {
    const recOffset = 6 + i * 12;
    const platformId = nameView.getUint16(recOffset);
    const nameId = nameView.getUint16(recOffset + 6);
    const length = nameView.getUint16(recOffset + 8);
    const offsetStr = nameView.getUint16(recOffset + 10);

    if (nameId === 1 || nameId === 4) {
      const strPos = stringsStart + offsetStr;
      const oldBytes = fontBuffer.slice(strPos, strPos + length);
      let decoded = "";
      if (platformId === 3) {
        for (let j = 0; j < oldBytes.length; j += 2) {
          decoded += String.fromCharCode((oldBytes[j] << 8) | oldBytes[j + 1]);
        }
      } else {
        decoded = Buffer.from(oldBytes).toString("latin1");
      }
      const newStr = (decoded + " " + newSuffix).slice(0, decoded.length).padEnd(decoded.length, " ");

      const outBytes = Buffer.alloc(length);
      if (platformId === 3) {
        for (let j = 0; j < newStr.length; j++) {
          const code = newStr.charCodeAt(j);
          outBytes[j * 2] = (code >> 8) & 0xff;
          outBytes[j * 2 + 1] = code & 0xff;
        }
      } else {
        outBytes.write(newStr, 0, "latin1");
      }
      outBytes.copy(fontBuffer, strPos);
    }
  }

  // Recompute checksums
  const sumTable = (start, length) => {
    const padded = Math.ceil(length / 4) * 4;
    let sum = 0;
    for (let i = 0; i < padded; i += 4) {
      const a = start + i;
      const v = (fontBuffer[a] << 24) | (fontBuffer[a + 1] << 16) | (fontBuffer[a + 2] << 8) | (fontBuffer[a + 3] || 0);
      sum = (sum + (v >>> 0)) >>> 0;
    }
    return sum >>> 0;
  };

  // Zero checksumAdjustment
  if (headOffset) {
    const adjOffset = headOffset + 8;
    view.setUint32(adjOffset, 0);
  }

  records.forEach(r => {
    const checksum = sumTable(r.tableOffset, r.tableLength);
    view.setUint32(r.recordOffset + 4, checksum);
  });

  const total = sumTable(0, fontBuffer.length);
  const checksumAdjustment = (0xB1B0AFBA - total) >>> 0;
  if (headOffset) {
    view.setUint32(headOffset + 8, checksumAdjustment);
  }
}

function usage() {
  console.log("fontparser --font path.ttf [--coverage] [--localise es] [--out output.ttf]");
}

async function main() {
  const args = parseArgs();
  const fontPath = args.font;
  if (!fontPath) {
    usage();
    process.exit(1);
  }
  const resolved = path.resolve(process.cwd(), fontPath);
  const font = loadFont(resolved);

  if (args.coverage) {
    printCoverage(font);
  }

  if (args.localise) {
    const lang = String(args.localise);
    const info = supportsLanguage(font, lang);
    if (!info) {
      console.error(`Unknown language code: ${lang}`);
      process.exit(1);
    }
    const outPath = args.out ? path.resolve(process.cwd(), args.out) : path.resolve(__dirname, `${path.basename(resolved, ".ttf")}-${lang}.ttf`);
    const buffer = Buffer.from(fs.readFileSync(resolved));
    updateNameTableBuffer(buffer, lang.toUpperCase());
    fs.writeFileSync(outPath, buffer);
    console.log(`Wrote localized font: ${outPath}`);
    if (!info.supported) {
      console.log(`Missing glyphs (${info.missing.length}): ${info.missing.slice(0, 30).join(" ")}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
