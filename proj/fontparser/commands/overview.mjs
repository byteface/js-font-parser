import { printMetadata } from "./meta.mjs";
import { printGlyphStats, printKerningStats, printTables } from "./tables.mjs";
import { printSupportedLanguages } from "./languages.mjs";

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
