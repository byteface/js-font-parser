import { Table } from "../../../dist/table/Table.js";
import { getTableData, getTableRecords, getLocaOffsets, getGlyphMetric, tagToString, uniqueChars } from "../lib/font-utils.mjs";

export function printTables(buffer, asJson = false) {
  const { records } = getTableRecords(buffer);
  const rows = records
    .map(r => ({
      tag: tagToString(r.tag),
      checksum: `0x${r.checkSum.toString(16).padStart(8, "0")}`,
      offset: r.tableOffset,
      length: r.tableLength
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  const totalLength = rows.reduce((acc, r) => acc + r.length, 0);
  console.log(`Tables (${rows.length}) total length: ${totalLength} bytes`);
  rows.forEach(r => {
    console.log(`${r.tag.padEnd(6)} off:${String(r.offset).padStart(8)}  len:${String(r.length).padStart(8)}  sum:${r.checksum}`);
  });
}

export function printGlyphStats(buffer, font, asJson = false) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const loca = getTableData(buffer, Table.loca);
  if (!head || !hhea || !maxp || !loca) {
    throw new Error("Missing required tables for glyph stats.");
  }

  const offsets = getLocaOffsets(loca, head.indexToLocFormat, maxp.numGlyphs);
  const glyfTable = font.getTableByType(Table.glyf);
  let empty = 0;
  let simple = 0;
  let composite = 0;
  let unknown = 0;
  for (let gid = 0; gid < maxp.numGlyphs; gid++) {
    const start = offsets[gid];
    const end = offsets[gid + 1];
    if (end <= start) {
      empty++;
      continue;
    }
    const desc = glyfTable?.getDescription?.(gid);
    if (!desc) {
      unknown++;
      continue;
    }
    if (desc.isComposite?.()) composite++;
    else simple++;
  }

  const stats = {
    glyphCount: maxp.numGlyphs,
    numberOfHMetrics: hhea.numberOfHMetrics,
    indexToLocFormat: head.indexToLocFormat,
    simpleGlyphs: simple,
    compositeGlyphs: composite,
    emptyGlyphs: empty,
    unknownGlyphs: unknown
  };

  if (asJson) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }
  console.log("Glyph stats");
  console.log(`  glyphCount: ${stats.glyphCount}`);
  console.log(`  simpleGlyphs: ${stats.simpleGlyphs}`);
  console.log(`  compositeGlyphs: ${stats.compositeGlyphs}`);
  console.log(`  emptyGlyphs: ${stats.emptyGlyphs}`);
  console.log(`  unknownGlyphs: ${stats.unknownGlyphs}`);
  console.log(`  numberOfHMetrics: ${stats.numberOfHMetrics}`);
  console.log(`  indexToLocFormat: ${stats.indexToLocFormat}`);
}

export function printKerningStats(font, chars, limit = 20, asJson = false) {
  const charList = uniqueChars(chars).filter(ch => ch !== " ");
  if (charList.length < 2) {
    throw new Error("Kerning stats requires at least 2 unique non-space characters.");
  }

  const rows = [];
  let nonZeroPairs = 0;
  let negativePairs = 0;
  let positivePairs = 0;
  for (const left of charList) {
    for (const right of charList) {
      const value = font.getKerningValue(left, right) || 0;
      if (value === 0) continue;
      nonZeroPairs++;
      if (value < 0) negativePairs++;
      if (value > 0) positivePairs++;
      rows.push({ pair: `${left}${right}`, value });
    }
  }

  const byMagnitude = rows.slice().sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, limit);
  const topNegative = rows.slice().sort((a, b) => a.value - b.value).slice(0, limit);
  const topPositive = rows.slice().sort((a, b) => b.value - a.value).slice(0, limit);
  const kernTable = font.getTableByType?.(Table.kern);
  const gposTable = font.getTableByType?.(Table.GPOS);

  const stats = {
    sampleChars: charList.join(""),
    sampleCharCount: charList.length,
    testedPairs: charList.length * charList.length,
    nonZeroPairs,
    negativePairs,
    positivePairs,
    hasKernTable: Boolean(kernTable),
    hasGposTable: Boolean(gposTable),
    topByMagnitude: byMagnitude,
    topNegative,
    topPositive
  };

  if (asJson) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("Kerning stats");
  console.log(`  sampleCharCount: ${stats.sampleCharCount}`);
  console.log(`  testedPairs: ${stats.testedPairs}`);
  console.log(`  nonZeroPairs: ${stats.nonZeroPairs} (negative:${stats.negativePairs} positive:${stats.positivePairs})`);
  console.log(`  tables: kern:${stats.hasKernTable ? "yes" : "no"} gpos:${stats.hasGposTable ? "yes" : "no"}`);
  if (stats.topByMagnitude.length > 0) {
    console.log(`  strongest pairs: ${stats.topByMagnitude.map(r => `${r.pair}:${r.value}`).join(" | ")}`);
  } else {
    console.log("  strongest pairs: (none in sampled characters)");
  }
}
