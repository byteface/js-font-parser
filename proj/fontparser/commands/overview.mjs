export function printOverview(buffer, font, options = {}, deps) {
  const minCoveragePct = options.minCoveragePct ?? 90;
  const kerningChars = options.kerningChars ?? "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
  const kerningLimit = options.kerningLimit ?? 10;

  deps.printMetadata(font, false);
  console.log("");
  deps.printGlyphStats(buffer, font, false);
  console.log("");
  deps.printTables(buffer, false);
  console.log("");
  console.log(`Supported languages (>= ${minCoveragePct}%):`);
  deps.printSupportedLanguages(font, minCoveragePct / 100, false);
  console.log("");
  deps.printKerningStats(font, kerningChars, kerningLimit, false);
}
