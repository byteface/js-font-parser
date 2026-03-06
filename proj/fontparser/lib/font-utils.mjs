import fs from "node:fs";
import path from "node:path";

import { Table } from "../../../dist/table/Table.js";
import { listLanguages } from "../../../dist/utils/LanguageSupport.js";

export function uniqueChars(str) {
  return Array.from(new Set(Array.from(str || "")));
}

export function readCharsFromFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return uniqueChars(data.replace(/\s+/g, ""));
}

export function charsFromLanguage(code) {
  const lang = listLanguages().find(l => l.code === code);
  if (!lang) return null;
  return uniqueChars(lang.required);
}

export function updateNameTableBuffer(fontBuffer, newSuffix) {
  const view = new DataView(fontBuffer.buffer, fontBuffer.byteOffset, fontBuffer.byteLength);
  const numTables = view.getUint16(4);
  let offset = 12;
  let headOffset = 0;
  let nameOffset = 0;
  let nameLength = 0;
  const records = [];

  for (let i = 0; i < numTables; i++) {
    const tag = view.getUint32(offset);
    const checkSum = view.getUint32(offset + 4);
    const tableOffset = view.getUint32(offset + 8);
    const tableLength = view.getUint32(offset + 12);
    records.push({ tag, checkSum, tableOffset, tableLength, recordOffset: offset });
    if (tag === Table.head) headOffset = tableOffset;
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

export function getTableRecords(buffer) {
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

export function getTableData(buffer, tag) {
  const { records } = getTableRecords(buffer);
  const rec = records.find(r => r.tag === tag);
  if (!rec) return null;
  return buffer.slice(rec.tableOffset, rec.tableOffset + rec.tableLength);
}

export function tagToString(tag) {
  return String.fromCharCode(
    (tag >>> 24) & 0xff,
    (tag >>> 16) & 0xff,
    (tag >>> 8) & 0xff,
    tag & 0xff
  );
}

export function buildFormat4(mapping) {
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
  ranges.push([0xffff, 0xffff]);

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

  ranges.forEach(([s, e]) => {
    startCode.push(s);
    endCode.push(e);
    if (s === 0xffff && e === 0xffff) {
      idDelta.push(1);
      idRangeOffset.push(0);
      return;
    }
    idDelta.push(0);
    idRangeOffset.push(0);
    for (let c = s; c <= e; c++) {
      glyphIdArray.push(mapping[c] ?? 0);
    }
  });

  const headerSize = 16;
  const arraysSize = segCount * 2 * 4 + 2;
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
  buf.writeUInt16BE(0, p); p += 2;
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

export function rebuildFontWithTables(buffer, tableUpdates) {
  const { records } = getTableRecords(buffer);

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
  out.writeUInt32BE(0x00010000, 0);
  out.writeUInt16BE(newTables.length, 4);
  const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(newTables.length)));
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(Math.floor(Math.log2(newTables.length)), 8);
  out.writeUInt16BE(newTables.length * 16 - searchRange, 10);

  let recordOffset = 12;
  tableRecords.forEach(r => {
    out.writeUInt32BE(r.tag, recordOffset);
    out.writeUInt32BE(0, recordOffset + 4);
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
    out.writeUInt32BE(0, headRec.offset + 8);
    const total = sumTable(0, out.length);
    const checksumAdjustment = (0xB1B0AFBA - total) >>> 0;
    out.writeUInt32BE(checksumAdjustment, headRec.offset + 8);
  }
  return out;
}

export function getLocaOffsets(locaBuffer, indexToLocFormat, numGlyphs) {
  const offsets = [];
  const view = new DataView(locaBuffer.buffer, locaBuffer.byteOffset, locaBuffer.byteLength);
  if (indexToLocFormat === 0) {
    for (let i = 0; i <= numGlyphs; i++) offsets.push(view.getUint16(i * 2) * 2);
  } else {
    for (let i = 0; i <= numGlyphs; i++) offsets.push(view.getUint32(i * 4));
  }
  return offsets;
}

export function getGlyphMetric(hmtxBuf, numberOfHMetrics, glyphId) {
  const safeNhm = Math.max(1, numberOfHMetrics);
  if (glyphId < safeNhm) {
    const p = glyphId * 4;
    return { advance: hmtxBuf.readUInt16BE(p), lsb: hmtxBuf.readInt16BE(p + 2) };
  }
  const advP = (safeNhm - 1) * 4;
  const lsbP = safeNhm * 4 + (glyphId - safeNhm) * 2;
  return { advance: hmtxBuf.readUInt16BE(advP), lsb: hmtxBuf.readInt16BE(lsbP) };
}

export function remapCompositeGlyphData(rawGlyph, glyphMap) {
  if (!rawGlyph || rawGlyph.length < 10) return rawGlyph;
  const numberOfContours = rawGlyph.readInt16BE(0);
  if (numberOfContours >= 0) return rawGlyph;

  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const MORE_COMPONENTS = 0x0020;
  const WE_HAVE_A_SCALE = 0x0008;
  const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
  const WE_HAVE_A_2X2 = 0x0080;

  const out = Buffer.from(rawGlyph);
  let p = 10;
  while (p + 4 <= out.length) {
    const flags = out.readUInt16BE(p);
    const oldGlyphId = out.readUInt16BE(p + 2);
    const newGlyphId = glyphMap.get(oldGlyphId);
    if (newGlyphId == null) {
      throw new Error(`Composite glyph references dropped component glyph ${oldGlyphId}`);
    }
    out.writeUInt16BE(newGlyphId, p + 2);
    p += 4;

    p += (flags & ARG_1_AND_2_ARE_WORDS) ? 4 : 2;
    if (flags & WE_HAVE_A_SCALE) p += 2;
    else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) p += 4;
    else if (flags & WE_HAVE_A_2X2) p += 8;

    if (!(flags & MORE_COMPONENTS)) break;
  }

  return out;
}

export function basenameNoExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
