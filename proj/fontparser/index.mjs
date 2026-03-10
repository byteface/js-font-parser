import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FontParser } from "../../dist/data/FontParser.js";
import { supportsLanguage } from "../../dist/utils/LanguageSupport.js";

import { parseArgs, parseBoolean, printUsage } from "./cli/args.mjs";
import { runCli } from "./cli/runner.mjs";
import { EXIT_CODES, inputError, ioError } from "./cli/errors.mjs";
import { writeJsonError } from "./cli/response.mjs";
import {
  getCoverageRows,
  getSupportedRows,
  getMissingCharsPayload,
  getLanguages,
  printCoverage,
  printSupportedLanguages,
  printMissingChars,
  printLanguages
} from "./commands/languages.mjs";
import { printMetadata } from "./commands/meta.mjs";
import { getOverviewData, printOverview } from "./commands/overview.mjs";
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
  detectSfntKind,
  asArrayBuffer
} from "./commands/convert.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFont(pathLike) {
  const data = fs.readFileSync(pathLike);
  return FontParser.fromArrayBuffer(asArrayBuffer(data));
}

async function main() {
  const parsed = parseArgs();
  const args = parsed.args ?? {};

  if (!parsed.command || parsed.command === "help") {
    printUsage();
    return;
  }

  const knownCommands = new Set(["coverage", "inspect", "svg", "subset", "convert", "localise"]);
  const isKnownCommand = knownCommands.has(parsed.command);
  const allowNoFont = !isKnownCommand || (parsed.command === "coverage" && Boolean(args["list-languages"]));
  const fontPath = args.font != null ? String(args.font) : "";
  if (!allowNoFont && !fontPath) {
    throw inputError("--font is required.");
  }

  const resolved = fontPath ? path.resolve(process.cwd(), fontPath) : "";
  let originalBuffer = null;
  if (fontPath) {
    try {
      originalBuffer = Buffer.from(fs.readFileSync(resolved));
    } catch (err) {
      throw ioError(`Failed to read font file: ${resolved}`, { cause: String(err?.message || err) });
    }
  }
  const font = (fontPath && parsed.command !== "convert") ? loadFont(resolved) : null;

  await runCli(parsed, {
    font,
    originalBuffer,
    resolved,
    __dirname,
    parseBoolean,
    printUsage
  }, {
    getCoverageRows,
    getSupportedRows,
    getMissingCharsPayload,
    getLanguages,
    printLanguages,
    printCoverage,
    printSupportedLanguages,
    printMissingChars,
    printTables,
    printGlyphStats,
    printKerningStats,
    getOverviewData,
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
    detectInputType,
    detectSfntKind
  });
}

main().catch(err => {
  const parsed = parseArgs();
  const args = parsed.args ?? {};
  const asJson = Boolean(args.json);
  if (asJson) {
    writeJsonError(err, parsed.command || null);
  } else {
    console.error(`${err?.code || "E_INTERNAL"}: ${err?.message || String(err)}`);
  }
  process.exit(Number.isInteger(err?.exitCode) ? err.exitCode : EXIT_CODES.INTERNAL);
});
