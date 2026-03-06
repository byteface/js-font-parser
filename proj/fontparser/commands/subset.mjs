import { Table } from "../../../dist/table/Table.js";
import {
  buildFormat4,
  charsFromLanguage,
  getGlyphMetric,
  getLocaOffsets,
  getTableData,
  rebuildFontWithTables,
  remapCompositeGlyphData,
  uniqueChars,
  readCharsFromFile
} from "../lib/font-utils.mjs";

export function collectSubsetChars(args) {
  const chars = [];
  const pushUnique = (arr) => {
    for (const ch of arr) {
      if (!chars.includes(ch)) chars.push(ch);
    }
  };

  if (args["subset-chars"]) {
    pushUnique(uniqueChars(String(args["subset-chars"])));
  }
  if (args["subset-file"]) {
    const filePath = args.resolveCwdPath
      ? args.resolveCwdPath(String(args["subset-file"]))
      : String(args["subset-file"]);
    pushUnique(readCharsFromFile(filePath));
  }
  if (args["subset-lang"]) {
    const codes = String(args["subset-lang"]).split(",").map(s => s.trim()).filter(Boolean);
    for (const code of codes) {
      const langChars = charsFromLanguage(code);
      if (!langChars) {
        throw new Error(`Unknown language code in --subset-lang: ${code}`);
      }
      pushUnique(langChars);
    }
  }
  return chars;
}

export function buildSubsetFont(buffer, font, subsetChars) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const glyf = getTableData(buffer, Table.glyf);
  const loca = getTableData(buffer, Table.loca);
  const hmtx = getTableData(buffer, Table.hmtx);
  if (!head || !hhea || !maxp || !glyf || !loca || !hmtx) {
    throw new Error("Subset currently supports TTF glyf/loca/hmtx fonts only.");
  }

  const requestedChars = uniqueChars(subsetChars.join(""));
  const selectedCharMap = new Map();
  const missingChars = [];
  const nonBmpChars = [];
  for (const ch of requestedChars) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    if (cp > 0xffff) {
      nonBmpChars.push(ch);
      continue;
    }
    const gid = font.getGlyphIndexByChar(ch);
    if (gid == null) {
      missingChars.push(ch);
      continue;
    }
    selectedCharMap.set(ch, gid);
  }

  const keep = new Set([0, ...selectedCharMap.values()]);
  const glyfTable = font.getTableByType(Table.glyf);
  const queue = Array.from(keep);
  while (queue.length > 0) {
    const gid = queue.pop();
    if (gid == null) continue;
    const desc = glyfTable?.getDescription?.(gid);
    if (!desc?.isComposite?.() || !Array.isArray(desc.components)) continue;
    for (const comp of desc.components) {
      const cgid = comp?.glyphIndex;
      if (typeof cgid !== "number") continue;
      if (keep.has(cgid)) continue;
      keep.add(cgid);
      queue.push(cgid);
    }
  }

  const oldGlyphIds = Array.from(keep).sort((a, b) => a - b);
  const glyphMap = new Map(oldGlyphIds.map((oldId, i) => [oldId, i]));

  const offsets = getLocaOffsets(loca, head.indexToLocFormat, maxp.numGlyphs);
  const glyfChunks = [];
  const newOffsets = [0];
  let cursor = 0;
  for (const oldId of oldGlyphIds) {
    const start = offsets[oldId];
    const end = offsets[oldId + 1];
    const raw = Buffer.from(glyf.slice(start, end));
    const remapped = remapCompositeGlyphData(raw, glyphMap);
    glyfChunks.push(remapped);
    cursor += remapped.length;
    const pad = (4 - (cursor % 4)) % 4;
    if (pad) {
      glyfChunks.push(Buffer.alloc(pad));
      cursor += pad;
    }
    newOffsets.push(cursor);
  }
  const newGlyf = Buffer.concat(glyfChunks);

  const indexToLocFormat = head.indexToLocFormat;
  const newLoca = Buffer.alloc(indexToLocFormat === 0 ? newOffsets.length * 2 : newOffsets.length * 4);
  const locaView = new DataView(newLoca.buffer, newLoca.byteOffset, newLoca.byteLength);
  for (let i = 0; i < newOffsets.length; i++) {
    if (indexToLocFormat === 0) locaView.setUint16(i * 2, newOffsets[i] / 2);
    else locaView.setUint32(i * 4, newOffsets[i]);
  }

  const newGlyphCount = oldGlyphIds.length;
  const newHmtx = Buffer.alloc(newGlyphCount * 4);
  for (let i = 0; i < oldGlyphIds.length; i++) {
    const metric = getGlyphMetric(hmtx, hhea.numberOfHMetrics, oldGlyphIds[i]);
    newHmtx.writeUInt16BE(metric.advance, i * 4);
    newHmtx.writeInt16BE(metric.lsb, i * 4 + 2);
  }

  const newHhea = Buffer.from(getTableData(buffer, Table.hhea));
  newHhea.writeUInt16BE(newGlyphCount, 34);
  const newMaxp = Buffer.from(getTableData(buffer, Table.maxp));
  newMaxp.writeUInt16BE(newGlyphCount, 4);

  const cmapMap = {};
  for (const [ch, oldGid] of selectedCharMap.entries()) {
    const cp = ch.codePointAt(0);
    if (cp == null || cp > 0xffff) continue;
    cmapMap[cp] = glyphMap.get(oldGid) ?? 0;
  }
  const format4 = buildFormat4(cmapMap);
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
  updates.set(Table.hmtx, newHmtx);
  updates.set(Table.hhea, newHhea);
  updates.set(Table.maxp, newMaxp);
  updates.set(Table.cmap, newCmap);

  return {
    buffer: rebuildFontWithTables(buffer, updates),
    report: {
      requestedChars: requestedChars.length,
      mappedChars: selectedCharMap.size,
      missingChars,
      nonBmpChars,
      oldGlyphCount: maxp.numGlyphs,
      newGlyphCount,
      reductionPct: Math.round((1 - (newGlyphCount / Math.max(1, maxp.numGlyphs))) * 100),
      keptGlyphIds: oldGlyphIds
    }
  };
}
