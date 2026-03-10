import { Table } from "../../../dist/table/Table.js";
import { getMetadataSummary, printMetadata } from "./meta.mjs";
import { getGlyphStatsData, getKerningStatsData, getTablesData, printGlyphStats, printKerningStats, printTables } from "./tables.mjs";
import { getSupportedRows, printSupportedLanguages } from "./languages.mjs";

function decodeScriptTag(tagInt) {
  return String.fromCharCode(
    (tagInt >> 24) & 0xff,
    (tagInt >> 16) & 0xff,
    (tagInt >> 8) & 0xff,
    tagInt & 0xff
  );
}

function collectScriptTags(table) {
  const records = table?.scriptList?.getScriptRecords?.() ?? [];
  return records.map((r) => decodeScriptTag(r.tag)).filter(Boolean);
}

function collectVariationData(font) {
  const axes = font.getVariationAxes?.() ?? [];
  return {
    hasFvar: axes.length > 0,
    axisCount: axes.length,
    axes: axes.map((a) => ({
      tag: a.name,
      minValue: a.minValue,
      defaultValue: a.defaultValue,
      maxValue: a.maxValue
    }))
  };
}

function collectColorData(font) {
  const cpal = font.getTableByType(Table.CPAL);
  const colr = font.getTableByType(Table.COLR);
  const svg = font.getTableByType(Table.SVG);

  return {
    hasColorTables: Boolean(cpal || colr || svg),
    cpal: cpal
      ? {
          version: cpal.version,
          numPalettes: cpal.numPalettes,
          numPaletteEntries: cpal.numPaletteEntries,
          numColorRecords: cpal.numColorRecords
        }
      : null,
    colr: colr
      ? {
          version: colr.version,
          numBaseGlyphRecords: colr.numBaseGlyphRecords ?? 0,
          numLayerRecords: colr.numLayerRecords ?? 0,
          hasV1PaintGraph: Array.isArray(colr.baseGlyphPaintRecords) && colr.baseGlyphPaintRecords.length > 0
        }
      : null,
    svg: svg
      ? {
          version: svg.version,
          documentEntryCount: Array.isArray(svg.entries) ? svg.entries.length : 0
        }
      : null
  };
}

function collectDiagnosticsSummary(font) {
  const diagnostics = font.getDiagnostics?.() ?? [];
  const byCode = {};
  const byLevel = {};
  const byPhase = {};
  for (const d of diagnostics) {
    byCode[d.code] = (byCode[d.code] ?? 0) + 1;
    byLevel[d.level] = (byLevel[d.level] ?? 0) + 1;
    byPhase[d.phase] = (byPhase[d.phase] ?? 0) + 1;
  }
  return {
    total: diagnostics.length,
    byCode,
    byLevel,
    byPhase
  };
}

export function getOverviewData(buffer, font, options = {}) {
  const minCoveragePct = options.minCoveragePct ?? 90;
  const kerningChars = options.kerningChars ?? "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
  const kerningLimit = options.kerningLimit ?? 10;

  const metadata = getMetadataSummary(font);
  const glyphStats = getGlyphStatsData(buffer, font);
  const tables = getTablesData(buffer);
  const supportedLanguages = getSupportedRows(font, minCoveragePct / 100);
  const kerning = getKerningStatsData(font, kerningChars, kerningLimit);
  const gsub = font.getTableByType(Table.GSUB);
  const gpos = font.getTableByType(Table.GPOS);
  const scripts = {
    gsub: collectScriptTags(gsub),
    gpos: collectScriptTags(gpos)
  };
  const variation = collectVariationData(font);
  const color = collectColorData(font);
  const diagnostics = collectDiagnosticsSummary(font);

  return {
    metadata,
    glyphStats,
    tables,
    scripts,
    supportedLanguages,
    variation,
    color,
    diagnostics,
    kerning,
    options: {
      minCoveragePct,
      kerningChars,
      kerningLimit
    }
  };
}

export function printOverview(buffer, font, options = {}) {
  const data = getOverviewData(buffer, font, options);

  printMetadata(font, false);
  console.log("");
  printGlyphStats(buffer, font, false);
  console.log("");
  printTables(buffer, false);
  console.log("");
  console.log(`Scripts: GSUB[${data.scripts.gsub.join(", ") || "none"}] GPOS[${data.scripts.gpos.join(", ") || "none"}]`);
  console.log(`Supported languages (>= ${data.options.minCoveragePct}%):`);
  printSupportedLanguages(font, data.options.minCoveragePct / 100, false);
  console.log("");
  console.log(`Variation axes: ${data.variation.axisCount}`);
  if (data.variation.axes.length) {
    console.log(`  ${data.variation.axes.map((a) => `${a.tag}(${a.minValue}..${a.defaultValue}..${a.maxValue})`).join(" | ")}`);
  }
  console.log(`Color tables: CPAL:${data.color.cpal ? "yes" : "no"} COLR:${data.color.colr ? "yes" : "no"} SVG:${data.color.svg ? "yes" : "no"}`);
  console.log(`Diagnostics: ${data.diagnostics.total}`);
  console.log("");
  printKerningStats(font, data.options.kerningChars, data.options.kerningLimit, false);
}
