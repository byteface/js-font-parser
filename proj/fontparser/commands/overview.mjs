import { getMetadataSummary, printMetadata } from "./meta.mjs";
import { getGlyphStatsData, getKerningStatsData, getTablesData, printGlyphStats, printKerningStats, printTables } from "./tables.mjs";
import { getSupportedRows, printSupportedLanguages } from "./languages.mjs";

export function getOverviewData(buffer, font, options = {}) {
  const minCoveragePct = options.minCoveragePct ?? 90;
  const kerningChars = options.kerningChars ?? "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
  const kerningLimit = options.kerningLimit ?? 10;

  const metadata = getMetadataSummary(font);
  const glyphStats = getGlyphStatsData(buffer, font);
  const tables = getTablesData(buffer);
  const supportedLanguages = getSupportedRows(font, minCoveragePct / 100);
  const kerning = getKerningStatsData(font, kerningChars, kerningLimit);

  return {
    metadata,
    glyphStats,
    tables,
    supportedLanguages,
    kerning,
    options: {
      minCoveragePct,
      kerningChars,
      kerningLimit
    }
  };
}

export function printOverview(buffer, font, options = {}) {
  const minCoveragePct = options.minCoveragePct ?? 90;
  const kerningChars = options.kerningChars ?? "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
  const kerningLimit = options.kerningLimit ?? 10;

  printMetadata(font, false);
  console.log("");
  printGlyphStats(buffer, font, false);
  console.log("");
  printTables(buffer, false);
  console.log("");
  console.log(`Supported languages (>= ${minCoveragePct}%):`);
  printSupportedLanguages(font, minCoveragePct / 100, false);
  console.log("");
  printKerningStats(font, kerningChars, kerningLimit, false);
}
