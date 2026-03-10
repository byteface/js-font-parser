import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FontParser } from "../../dist/data/FontParser.js";
import { decodeWoff2, setWoff2Decoder, setWoff2DecoderAsync } from "../../dist/utils/Woff2Decoder.js";
import { supportsLanguage } from "../../dist/utils/LanguageSupport.js";

import { parseArgs, parseBoolean, printUsage } from "./cli/args.mjs";
import { runCli } from "./cli/runner.mjs";
import { EXIT_CODES, commandError, inputError, ioError } from "./cli/errors.mjs";
import { writeJsonError } from "./cli/response.mjs";
import { configureWoff2Decoder } from "./cli/woff2-decoder.mjs";
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
const TAG_WOFF2 = 0x774f4632; // "wOF2"

function loadFont(pathLike) {
  const data = fs.readFileSync(pathLike);
  return FontParser.fromArrayBuffer(asArrayBuffer(data));
}

function mapWoff2DecoderError(err) {
  const message = String(err?.message || err || "");
  if (!message.includes("WOFF2 decoder not available")) return err;
  return commandError(
    'WOFF2 decoder not available for CLI. Pass --woff2-decoder <module-or-path> (example: "woff2").'
  );
}

function isWoff2Buffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const sig = buffer.readUInt32BE(0);
  return sig === TAG_WOFF2;
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
  await configureWoff2Decoder(args["woff2-decoder"], setWoff2Decoder, setWoff2DecoderAsync);
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
  let font = null;
  if (fontPath && parsed.command !== "convert") {
    try {
      font = loadFont(resolved);
    } catch (err) {
      throw mapWoff2DecoderError(err);
    }
    if (isWoff2Buffer(originalBuffer)) {
      try {
        const decoded = decodeWoff2(new Uint8Array(originalBuffer));
        originalBuffer = Buffer.from(decoded);
      } catch (err) {
        throw mapWoff2DecoderError(err);
      }
    }
  }

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
  const mapped = mapWoff2DecoderError(err);
  if (asJson) {
    writeJsonError(mapped, parsed.command || null);
  } else {
    console.error(`${mapped?.code || "E_INTERNAL"}: ${mapped?.message || String(mapped)}`);
  }
  process.exit(Number.isInteger(mapped?.exitCode) ? mapped.exitCode : EXIT_CODES.INTERNAL);
});
