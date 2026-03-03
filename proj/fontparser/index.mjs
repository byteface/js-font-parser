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

function getTableRecords(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const numTables = view.getUint16(4);
  const records = [];
  let offset = 12;
  for (let i = 0; i < numTables; i++) {
    const tag = view.getUint32(offset);
    const checkSum = view.getUint32(offset + 4);
    const tableOffset = view.getUint32(offset + 8);
    const tableLength = view.getUint32(offset + 12);
    records.push({ tag, checkSum, tableOffset, tableLength, recordOffset: offset });
    offset += 16;
  }
  return { view, records, numTables };
}

function getTableData(buffer, tag) {
  const { records } = getTableRecords(buffer);
  const rec = records.find(r => r.tag === tag);
  if (!rec) return null;
  return buffer.slice(rec.tableOffset, rec.tableOffset + rec.tableLength);
}

function setUint16(view, offset, value) {
  view.setUint16(offset, value);
}

function makeCompositeGlyph(baseGlyph, markGlyph, markDx, markDy, markTransform) {
  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const ARGS_ARE_XY_VALUES = 0x0002;
  const MORE_COMPONENTS = 0x0020;
  const WE_HAVE_A_2X2 = 0x0080;

  const parts = [];
  const header = Buffer.alloc(10);
  header.writeInt16BE(-1, 0); // numberOfContours = -1 for composite

  const xMin = Math.min(baseGlyph.xMin, markGlyph.xMin + markDx);
  const yMin = Math.min(baseGlyph.yMin, markGlyph.yMin + markDy);
  const xMax = Math.max(baseGlyph.xMax, markGlyph.xMax + markDx);
  const yMax = Math.max(baseGlyph.yMax, markGlyph.yMax + markDy);
  header.writeInt16BE(xMin, 2);
  header.writeInt16BE(yMin, 4);
  header.writeInt16BE(xMax, 6);
  header.writeInt16BE(yMax, 8);
  parts.push(header);

  const comp1 = Buffer.alloc(8);
  comp1.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES | MORE_COMPONENTS, 0);
  comp1.writeUInt16BE(baseGlyph.glyphId, 2);
  comp1.writeInt16BE(0, 4);
  comp1.writeInt16BE(0, 6);
  parts.push(comp1);

  if (markTransform) {
    const comp2 = Buffer.alloc(16);
    comp2.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES | WE_HAVE_A_2X2, 0);
    comp2.writeUInt16BE(markGlyph.glyphId, 2);
    comp2.writeInt16BE(markDx, 4);
    comp2.writeInt16BE(markDy, 6);
    comp2.writeInt16BE(markTransform.a, 8);
    comp2.writeInt16BE(markTransform.b, 10);
    comp2.writeInt16BE(markTransform.c, 12);
    comp2.writeInt16BE(markTransform.d, 14);
    parts.push(comp2);
  } else {
    const comp2 = Buffer.alloc(8);
    comp2.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES, 0);
    comp2.writeUInt16BE(markGlyph.glyphId, 2);
    comp2.writeInt16BE(markDx, 4);
    comp2.writeInt16BE(markDy, 6);
    parts.push(comp2);
  }

  let glyph = Buffer.concat(parts);
  const pad = (4 - (glyph.length % 4)) % 4;
  if (pad) glyph = Buffer.concat([glyph, Buffer.alloc(pad)]);
  return glyph;
}

function bboxFromGlyph(font, glyphId) {
  const glyph = font.getGlyph(glyphId);
  if (!glyph || !glyph.points) return null;
  const pts = glyph.points.slice(0, Math.max(0, glyph.getPointCount() - 2));
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  return {
    glyphId,
    xMin: xs.length ? Math.min(...xs) : 0,
    yMin: ys.length ? Math.min(...ys) : 0,
    xMax: xs.length ? Math.max(...xs) : 0,
    yMax: ys.length ? Math.max(...ys) : 0
  };
}

const MARKS = {
  "\u0300": { name: "grave", pos: "above" },
  "\u0301": { name: "acute", pos: "above" },
  "\u0302": { name: "circumflex", pos: "above" },
  "\u0303": { name: "tilde", pos: "above" },
  "\u0304": { name: "macron", pos: "above" },
  "\u0306": { name: "breve", pos: "above" },
  "\u0307": { name: "dot", pos: "above" },
  "\u0308": { name: "diaeresis", pos: "above" },
  "\u030A": { name: "ring", pos: "above" },
  "\u030B": { name: "double-acute", pos: "above" },
  "\u030C": { name: "caron", pos: "above" },
  "\u0327": { name: "cedilla", pos: "below" },
  "\u0328": { name: "ogonek", pos: "below" },
  "\u0335": { name: "short-stroke", pos: "overlay" }
};

const MARK_FALLBACKS = {
  "\u0301": [".", "´", "'"],
  "\u0300": [".", "`"],
  "\u0302": ["^"],
  "\u0303": ["~"],
  "\u0304": ["-"],
  "\u0306": ["˘"],
  "\u0307": ["."],
  "\u0308": [":"],
  "\u030A": ["o", "°"],
  "\u030B": ["\""],
  "\u030C": ["v"],
  "\u0327": [",", "."],
  "\u0328": [",", "."],
  "\u0335": ["-", "—"]
};

const DECOMPOSE = {
  "á": ["a", "\u0301"], "Á": ["A", "\u0301"],
  "à": ["a", "\u0300"], "À": ["A", "\u0300"],
  "â": ["a", "\u0302"], "Â": ["A", "\u0302"],
  "ã": ["a", "\u0303"], "Ã": ["A", "\u0303"],
  "ä": ["a", "\u0308"], "Ä": ["A", "\u0308"],
  "å": ["a", "\u030A"], "Å": ["A", "\u030A"],
  "ā": ["a", "\u0304"], "Ā": ["A", "\u0304"],
  "ă": ["a", "\u0306"], "Ă": ["A", "\u0306"],
  "ą": ["a", "\u0328"], "Ą": ["A", "\u0328"],
  "ç": ["c", "\u0327"], "Ç": ["C", "\u0327"],
  "ć": ["c", "\u0301"], "Ć": ["C", "\u0301"],
  "č": ["c", "\u030C"], "Č": ["C", "\u030C"],
  "ď": ["d", "\u030C"], "Ď": ["D", "\u030C"],
  "é": ["e", "\u0301"], "É": ["E", "\u0301"],
  "è": ["e", "\u0300"], "È": ["E", "\u0300"],
  "ê": ["e", "\u0302"], "Ê": ["E", "\u0302"],
  "ë": ["e", "\u0308"], "Ë": ["E", "\u0308"],
  "ě": ["e", "\u030C"], "Ě": ["E", "\u030C"],
  "ę": ["e", "\u0328"], "Ę": ["E", "\u0328"],
  "í": ["i", "\u0301"], "Í": ["I", "\u0301"],
  "ì": ["i", "\u0300"], "Ì": ["I", "\u0300"],
  "î": ["i", "\u0302"], "Î": ["I", "\u0302"],
  "ï": ["i", "\u0308"], "Ï": ["I", "\u0308"],
  "ñ": ["n", "\u0303"], "Ñ": ["N", "\u0303"],
  "ń": ["n", "\u0301"], "Ń": ["N", "\u0301"],
  "ó": ["o", "\u0301"], "Ó": ["O", "\u0301"],
  "ò": ["o", "\u0300"], "Ò": ["O", "\u0300"],
  "ô": ["o", "\u0302"], "Ô": ["O", "\u0302"],
  "õ": ["o", "\u0303"], "Õ": ["O", "\u0303"],
  "ö": ["o", "\u0308"], "Ö": ["O", "\u0308"],
  "ő": ["o", "\u030B"], "Ő": ["O", "\u030B"],
  "ú": ["u", "\u0301"], "Ú": ["U", "\u0301"],
  "ù": ["u", "\u0300"], "Ù": ["U", "\u0300"],
  "û": ["u", "\u0302"], "Û": ["U", "\u0302"],
  "ü": ["u", "\u0308"], "Ü": ["U", "\u0308"],
  "ű": ["u", "\u030B"], "Ű": ["U", "\u030B"],
  "ý": ["y", "\u0301"], "Ý": ["Y", "\u0301"],
  "ÿ": ["y", "\u0308"], "Ÿ": ["Y", "\u0308"],
  "ś": ["s", "\u0301"], "Ś": ["S", "\u0301"],
  "š": ["s", "\u030C"], "Š": ["S", "\u030C"],
  "ź": ["z", "\u0301"], "Ź": ["Z", "\u0301"],
  "ż": ["z", "\u0307"], "Ż": ["Z", "\u0307"],
  "ž": ["z", "\u030C"], "Ž": ["Z", "\u030C"],
  "ł": ["l", "\u0335"], "Ł": ["L", "\u0335"]
};

function buildFormat4(mapping) {
  const codes = Object.keys(mapping).map(n => Number(n)).filter(c => c >= 0 && c <= 0xffff).sort((a, b) => a - b);
  if (codes.length === 0) return Buffer.alloc(0);
  const ranges = [];
  let start = codes[0];
  let last = codes[0];
  for (let i = 1; i < codes.length; i++) {
    if (codes[i] === last + 1) {
      last = codes[i];
    } else {
      ranges.push([start, last]);
      start = last = codes[i];
    }
  }
  ranges.push([start, last]);
  ranges.push([0xffff, 0xffff]); // sentinel

  const segCount = ranges.length;
  const segCountX2 = segCount * 2;
  const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(segCount)));
  const entrySelector = Math.floor(Math.log2(segCount));
  const rangeShift = segCountX2 - searchRange;

  const endCode = [];
  const startCode = [];
  const idDelta = [];
  const idRangeOffset = [];
  const glyphIdArray = [];

  ranges.forEach(([s, e], i) => {
    startCode.push(s);
    endCode.push(e);
    if (s === 0xffff && e === 0xffff) {
      idDelta.push(1);
      idRangeOffset.push(0);
      return;
    }
    idDelta.push(0);
    // placeholder for idRangeOffset; filled later
    idRangeOffset.push(0);
    for (let c = s; c <= e; c++) {
      glyphIdArray.push(mapping[c] ?? 0);
    }
  });

  // Compute idRangeOffset values
  const headerSize = 16;
  const arraysSize = segCount * 2 * 4 + 2; // endCode + startCode + idDelta + idRangeOffset + reserved
  const glyphArrayStart = headerSize + arraysSize;
  let glyphIndex = 0;
  for (let i = 0; i < segCount; i++) {
    const s = startCode[i];
    const e = endCode[i];
    if (s === 0xffff && e === 0xffff) continue;
    const offset = glyphArrayStart + glyphIndex * 2 - (headerSize + segCount * 2 * 3 + 2 + i * 2);
    idRangeOffset[i] = offset;
    glyphIndex += (e - s + 1);
  }

  const length = headerSize + segCount * 2 + 2 + segCount * 2 + segCount * 2 + segCount * 2 + glyphIdArray.length * 2;
  const buf = Buffer.alloc(length);
  let p = 0;
  buf.writeUInt16BE(4, p); p += 2;
  buf.writeUInt16BE(length, p); p += 2;
  buf.writeUInt16BE(0, p); p += 2; // language
  buf.writeUInt16BE(segCountX2, p); p += 2;
  buf.writeUInt16BE(searchRange, p); p += 2;
  buf.writeUInt16BE(entrySelector, p); p += 2;
  buf.writeUInt16BE(rangeShift, p); p += 2;
  endCode.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  buf.writeUInt16BE(0, p); p += 2;
  startCode.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  idDelta.forEach(v => { buf.writeInt16BE(v, p); p += 2; });
  idRangeOffset.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  glyphIdArray.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  return buf;
}

function rebuildFontWithTables(buffer, tableUpdates) {
  const { records } = getTableRecords(buffer);
  const tableMap = new Map(records.map(r => [r.tag, r]));

  const newTables = records.map(r => {
    const updated = tableUpdates.get(r.tag);
    if (updated) return { tag: r.tag, data: updated };
    const orig = buffer.slice(r.tableOffset, r.tableOffset + r.tableLength);
    return { tag: r.tag, data: orig };
  });

  let offset = 12 + newTables.length * 16;
  const tableRecords = [];
  const chunks = [];
  newTables.forEach(t => {
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      offset += pad;
    }
    tableRecords.push({ tag: t.tag, offset, length: t.data.length });
    chunks.push(t.data);
    offset += t.data.length;
  });

  const out = Buffer.alloc(offset);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  // sfnt header
  out.writeUInt32BE(0x00010000, 0);
  out.writeUInt16BE(newTables.length, 4);
  const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(newTables.length)));
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(Math.floor(Math.log2(newTables.length)), 8);
  out.writeUInt16BE(newTables.length * 16 - searchRange, 10);

  let recordOffset = 12;
  tableRecords.forEach(r => {
    out.writeUInt32BE(r.tag, recordOffset);
    out.writeUInt32BE(0, recordOffset + 4); // checksum placeholder
    out.writeUInt32BE(r.offset, recordOffset + 8);
    out.writeUInt32BE(r.length, recordOffset + 12);
    recordOffset += 16;
  });

  let dataOffset = 12 + newTables.length * 16;
  chunks.forEach(chunk => {
    chunk.copy(out, dataOffset);
    dataOffset += chunk.length;
  });

  const sumTable = (start, length) => {
    const padded = Math.ceil(length / 4) * 4;
    let sum = 0;
    for (let i = 0; i < padded; i += 4) {
      const a = start + i;
      const v = (out[a] << 24) | (out[a + 1] << 16) | (out[a + 2] << 8) | (out[a + 3] || 0);
      sum = (sum + (v >>> 0)) >>> 0;
    }
    return sum >>> 0;
  };

  tableRecords.forEach((r, i) => {
    const checksum = sumTable(r.offset, r.length);
    out.writeUInt32BE(checksum, 12 + i * 16 + 4);
  });

  const headRec = tableRecords.find(r => r.tag === Table.head);
  if (headRec) {
    // zero checksumAdjustment
    out.writeUInt32BE(0, headRec.offset + 8);
    const total = sumTable(0, out.length);
    const checksumAdjustment = (0xB1B0AFBA - total) >>> 0;
    out.writeUInt32BE(checksumAdjustment, headRec.offset + 8);
  }
  return out;
}

function composeFont(buffer, font, targetChars) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const loca = getTableData(buffer, Table.loca);
  const glyf = getTableData(buffer, Table.glyf);
  const hmtx = getTableData(buffer, Table.hmtx);
  if (!head || !hhea || !maxp || !loca || !glyf || !hmtx) {
    throw new Error("Missing required tables for compose");
  }

  const indexToLocFormat = head.indexToLocFormat;
  const numGlyphs = maxp.numGlyphs;
  const numberOfHMetrics = hhea.numberOfHMetrics;

  const offsets = [];
  const locaView = new DataView(loca.buffer, loca.byteOffset, loca.byteLength);
  if (indexToLocFormat === 0) {
    for (let i = 0; i < numGlyphs + 1; i++) offsets.push(locaView.getUint16(i * 2) * 2);
  } else {
    for (let i = 0; i < numGlyphs + 1; i++) offsets.push(locaView.getUint32(i * 4));
  }

  const glyphRecords = [];
  const newMapping = {};
  let newGlyf = Buffer.from(glyf);
  let newOffsets = offsets.slice(0, -1);
  let newNumGlyphs = numGlyphs;

  const baseGap = Math.round((head.unitsPerEm ?? 1000) * 0.05);

  targetChars.forEach(ch => {
    if (font.getGlyphIndexByChar(ch)) return;
    const decomp = DECOMPOSE[ch];
    if (!decomp) return;
    const [baseChar, markChar] = decomp;
    const baseId = font.getGlyphIndexByChar(baseChar);
    let markId = font.getGlyphIndexByChar(markChar);
    let markFallbackUsed = null;
    if (markId == null) {
      const fallbacks = MARK_FALLBACKS[markChar] || [];
      for (const fb of fallbacks) {
        const fbId = font.getGlyphIndexByChar(fb);
        if (fbId != null) {
          markId = fbId;
          markFallbackUsed = fb;
          break;
        }
      }
    }
    if (baseId == null || markId == null) return;
    const baseBox = bboxFromGlyph(font, baseId);
    const markBox = bboxFromGlyph(font, markId);
    if (!baseBox || !markBox) return;
    const markInfo = MARKS[markChar];
    if (!markInfo) return;

    const baseCenter = (baseBox.xMin + baseBox.xMax) / 2;
    const markCenter = (markBox.xMin + markBox.xMax) / 2;
    const dx = Math.round(baseCenter - markCenter);
    let dy = 0;
    if (markInfo.pos === "above") {
      dy = Math.round(baseBox.yMax + baseGap - markBox.yMin);
    } else if (markInfo.pos === "below") {
      dy = Math.round(baseBox.yMin - baseGap - markBox.yMax);
    } else {
      const baseMid = (baseBox.yMin + baseBox.yMax) / 2;
      const markMid = (markBox.yMin + markBox.yMax) / 2;
      dy = Math.round(baseMid - markMid);
    }

    let markTransform = null;
    if (markInfo.pos === "overlay" && markFallbackUsed) {
      const angle = -12 * (Math.PI / 180);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const toFixed = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 16384)));
      markTransform = { a: toFixed(cos), b: toFixed(sin), c: toFixed(-sin), d: toFixed(cos) };
    }

    const glyphBuf = makeCompositeGlyph(baseBox, markBox, dx, dy, markTransform);
    const start = newGlyf.length;
    newGlyf = Buffer.concat([newGlyf, glyphBuf]);
    newOffsets.push(start);
    newNumGlyphs++;
    newMapping[ch.charCodeAt(0)] = newNumGlyphs - 1;

    const baseAdvance = font.getGlyph(baseId)?.advanceWidth ?? 0;
    const baseLsb = font.getGlyph(baseId)?.leftSideBearing ?? 0;
    const clamp16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v)));
    glyphRecords.push({ advance: clamp16(baseAdvance), lsb: clamp16(baseLsb) });
  });

  newOffsets.push(newGlyf.length);

  const newLoca = Buffer.alloc(indexToLocFormat === 0 ? (newNumGlyphs + 1) * 2 : (newNumGlyphs + 1) * 4);
  const locaViewNew = new DataView(newLoca.buffer, newLoca.byteOffset, newLoca.byteLength);
  for (let i = 0; i < newOffsets.length; i++) {
    if (indexToLocFormat === 0) {
      locaViewNew.setUint16(i * 2, newOffsets[i] / 2);
    } else {
      locaViewNew.setUint32(i * 4, newOffsets[i]);
    }
  }

  // update hmtx + hhea
  const hmtxBuf = Buffer.from(hmtx);
  const hmtxView = new DataView(hmtxBuf.buffer, hmtxBuf.byteOffset, hmtxBuf.byteLength);
  const newHmetrics = numberOfHMetrics + glyphRecords.length;
  const newHmtx = Buffer.alloc(newHmetrics * 4);
  hmtxBuf.copy(newHmtx, 0, 0, Math.min(hmtxBuf.length, newHmtx.length));
  let cursor = numberOfHMetrics * 4;
  glyphRecords.forEach(r => {
    newHmtx.writeUInt16BE(r.advance, cursor);
    newHmtx.writeInt16BE(r.lsb, cursor + 2);
    cursor += 4;
  });

  const newMaxp = Buffer.from(getTableData(buffer, Table.maxp));
  newMaxp.writeUInt16BE(newNumGlyphs, 4);

  const newHhea = Buffer.from(getTableData(buffer, Table.hhea));
  newHhea.writeUInt16BE(newHmetrics, 34);

  // cmap rebuild (format 4 for BMP)
  const cmap = getTableData(buffer, Table.cmap);
  const existingMap = {};
  for (let c = 0; c <= 0xffff; c++) {
    const gid = font.getGlyphIndexByChar(String.fromCharCode(c));
    if (gid) existingMap[c] = gid;
  }
  Object.assign(existingMap, newMapping);
  const format4 = buildFormat4(existingMap);
  const cmapHeader = Buffer.alloc(12);
  cmapHeader.writeUInt16BE(0, 0);
  cmapHeader.writeUInt16BE(1, 2);
  cmapHeader.writeUInt16BE(3, 4);
  cmapHeader.writeUInt16BE(1, 6);
  cmapHeader.writeUInt32BE(12, 8);
  const newCmap = Buffer.concat([cmapHeader, format4]);

  const updates = new Map();
  updates.set(Table.glyf, newGlyf);
  updates.set(Table.loca, newLoca);
  updates.set(Table.maxp, newMaxp);
  updates.set(Table.hhea, newHhea);
  updates.set(Table.hmtx, newHmtx);
  updates.set(Table.cmap, newCmap);

  return { buffer: rebuildFontWithTables(buffer, updates), composed: Object.keys(newMapping).length };
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
    let buffer = Buffer.from(fs.readFileSync(resolved));
    updateNameTableBuffer(buffer, lang.toUpperCase());
    if (!info.supported) {
      const { buffer: composed, composed: count } = composeFont(buffer, font, info.missing);
      buffer = composed;
      console.log(`Composed ${count} glyphs for missing characters.`);
      const stillMissing = supportsLanguage(new FontParserTTF(new ByteArray(new Uint8Array(buffer))), lang);
      if (stillMissing && !stillMissing.supported) {
        console.log(`Still missing (${stillMissing.missing.length}): ${stillMissing.missing.slice(0, 30).join(" ")}`);
      }
    }
    fs.writeFileSync(outPath, buffer);
    console.log(`Wrote localized font: ${outPath}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
