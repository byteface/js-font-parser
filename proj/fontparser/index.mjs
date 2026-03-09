import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FontParser } from "../../dist/data/FontParser.js";
import { supportsLanguage } from "../../dist/utils/LanguageSupport.js";

import { parseArgs, parseBoolean, printUsage } from "./cli/args.mjs";
import { runCli } from "./cli/runner.mjs";
import { printCoverage, printSupportedLanguages, printMissingChars, printLanguages } from "./commands/languages.mjs";
import { printMetadata } from "./commands/meta.mjs";
import { printOverview } from "./commands/overview.mjs";
import { printTables, printGlyphStats, printKerningStats } from "./commands/tables.mjs";
import { exportSvgText } from "./commands/svg-text.mjs";
import { buildSubsetFont, collectSubsetChars } from "./commands/subset.mjs";
import { composeFont } from "./commands/localise.mjs";
import { basenameNoExt, updateNameTableBuffer } from "./lib/font-utils.mjs";
import {
  convertSfntToWoff,
  convertWoffToSfnt,
  resolveConvertOutPath,
  detectInputType,
  asArrayBuffer
} from "./commands/convert.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFont(pathLike) {
  const data = fs.readFileSync(pathLike);
  return FontParser.fromArrayBuffer(asArrayBuffer(data));
}

async function main() {
  const args = parseArgs();
  const fontPath = args.font;
  if (!fontPath) {
    printUsage();
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), fontPath);
  const originalBuffer = Buffer.from(fs.readFileSync(resolved));
  const font = args.convert != null ? null : loadFont(resolved);

  await runCli(args, {
    font,
    originalBuffer,
    resolved,
    __dirname,
    parseBoolean
  }, {
    printLanguages,
    printCoverage,
    printSupportedLanguages,
    printMissingChars,
    printTables,
    printGlyphStats,
    printKerningStats,
    printOverview,
    exportSvgText,
    printMetadata,
    supportsLanguage,
    updateNameTableBuffer,
    composeFont,
    collectSubsetChars,
    buildSubsetFont,
    resolveCwdPath: (v) => path.resolve(process.cwd(), v),
    resolveDirPath: (dir, p) => path.resolve(dir, p),
    basenameNoExt,
    basenameWithExt: basenameNoExt,
    bufferFrom: (b) => Buffer.from(b),
    loadFontFromBuffer: (buffer) => FontParser.fromArrayBuffer(asArrayBuffer(buffer)),
    writeBuffer: (target, buffer) => fs.writeFileSync(target, buffer),
    writeUtf8: (target, data) => fs.writeFileSync(target, data, "utf8"),
    writeJson: (target, data) => fs.writeFileSync(target, JSON.stringify(data, null, 2)),
    convertSfntToWoff,
    convertWoffToSfnt,
    resolveConvertOutPath,
    detectInputType
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
