import { commandError, usageError } from "./errors.mjs";
import { writeJsonSuccess } from "./response.mjs";

function pushWarn(warnings, msg, asJson) {
  warnings.push(msg);
  if (!asJson) console.warn(`Warning: ${msg}`);
}

function requireFontPath(args) {
  const fontPath = args.font != null ? String(args.font) : "";
  if (!fontPath) {
    throw usageError("--font is required.");
  }
  return fontPath;
}

function parseMinCoverage(args, key = "min-coverage", fallback = 100) {
  const minCoveragePct = args[key] != null ? Number(args[key]) : fallback;
  if (!Number.isFinite(minCoveragePct) || minCoveragePct < 0 || minCoveragePct > 100) {
    throw usageError(`--${key} must be a number between 0 and 100.`);
  }
  return minCoveragePct;
}

function parseKerningLimit(args, fallback = 20) {
  const limit = args["kerning-limit"] != null ? Number(args["kerning-limit"]) : fallback;
  if (!Number.isFinite(limit) || limit <= 0) {
    throw usageError("--kerning-limit must be a positive number.");
  }
  return Math.floor(limit);
}

function parseSvgOptions(args, parseBoolean) {
  const text = args.text != null ? String(args.text) : "";
  if (!text.length) {
    throw usageError("--text must not be empty.");
  }

  const fontSize = args["font-size"] != null ? Number(args["font-size"]) : 96;
  const padding = args.padding != null ? Number(args.padding) : 24;
  const lineHeight = args["line-height"] != null ? Number(args["line-height"]) : 1.2;
  const letterSpacing = args["letter-spacing"] != null ? Number(args["letter-spacing"]) : 0;
  const strokeWidth = args["stroke-width"] != null ? Number(args["stroke-width"]) : 0;

  if (!Number.isFinite(fontSize) || fontSize <= 0) throw usageError("--font-size must be > 0.");
  if (!Number.isFinite(padding) || padding < 0) throw usageError("--padding must be >= 0.");
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) throw usageError("--line-height must be > 0.");
  if (!Number.isFinite(letterSpacing)) throw usageError("--letter-spacing must be numeric.");
  if (!Number.isFinite(strokeWidth) || strokeWidth < 0) throw usageError("--stroke-width must be >= 0.");

  return {
    text,
    options: {
      fontSize,
      fill: args.fill != null ? String(args.fill) : "#111111",
      stroke: args.stroke != null ? String(args.stroke) : "none",
      strokeWidth,
      padding,
      lineHeight,
      letterSpacing,
      useKerning: parseBoolean(args["use-kerning"], true),
      background: args.bg != null ? String(args.bg) : null
    }
  };
}

export async function runCli(parsed, ctx, actions) {
  const { command, args } = parsed;
  const { font, originalBuffer, resolved, __dirname, parseBoolean, printUsage } = ctx;
  const asJson = Boolean(args.json);

  if (!command || command === "help") {
    printUsage();
    return;
  }

  switch (command) {
    case "convert": {
      requireFontPath(args);
      const mode = args.to != null ? String(args.to).toLowerCase() : "";
      const warnings = [];
      if (!["woff", "sfnt", "ttf", "otf"].includes(mode)) {
        throw usageError("--to must be one of: woff, sfnt, ttf, otf.");
      }
      const inType = actions.detectInputType(originalBuffer);
      if (inType === "woff2") {
        throw commandError("convert does not support WOFF2 input. Use WOFF1 input for now.");
      }
      if (mode === "woff") {
        if (inType !== "sfnt") {
          throw commandError("convert --to woff expects TTF/OTF sfnt input.");
        }
        const inKind = actions.detectSfntKind(originalBuffer);
        if (inKind === "other") {
          throw commandError("convert --to woff only supports TrueType (glyf) and OpenType CFF (OTTO) sfnt flavors.");
        }
        const woffBuffer = actions.convertSfntToWoff(originalBuffer);
        const outPath = actions.resolveConvertOutPath(resolved, "woff", args.out);
        actions.writeBuffer(outPath, woffBuffer);
        if (asJson) writeJsonSuccess("convert", { to: "woff", outPath, inputType: inType, inputSfntKind: inKind, warnings });
        else console.log(`Wrote WOFF: ${outPath}`);
        return;
      }

      if (inType !== "woff") {
        throw commandError("convert --to sfnt/ttf/otf expects WOFF input.");
      }
      const sfntBuffer = actions.convertWoffToSfnt(originalBuffer);
      const sfntKind = actions.detectSfntKind(sfntBuffer);
      if (sfntKind === "other") {
        throw commandError("Decoded WOFF uses unsupported sfnt flavor for ttf/otf labeling.");
      }
      if (mode === "ttf" && sfntKind !== "ttf") {
        throw commandError("Requested --to ttf but WOFF payload is OpenType CFF. Use --to otf or --to sfnt.");
      }
      if (mode === "otf" && sfntKind !== "otf") {
        throw commandError("Requested --to otf but WOFF payload is TrueType. Use --to ttf or --to sfnt.");
      }
      const outPath = actions.resolveConvertOutPath(resolved, mode, args.out, sfntBuffer);
      if (mode === "sfnt" && args.out) {
        const outPathStr = String(args.out).toLowerCase();
        if (sfntKind === "ttf" && outPathStr.endsWith(".otf")) {
          pushWarn(warnings, "Output file extension .otf does not match decoded TrueType sfnt flavor.", asJson);
        } else if (sfntKind === "otf" && outPathStr.endsWith(".ttf")) {
          pushWarn(warnings, "Output file extension .ttf does not match decoded OpenType CFF sfnt flavor.", asJson);
        }
      }
      actions.writeBuffer(outPath, sfntBuffer);
      const label = mode === "otf" ? "OTF" : (mode === "ttf" ? "TTF" : "SFNT");
      if (asJson) writeJsonSuccess("convert", { to: mode, outPath, inputType: inType, outputLabel: label, outputSfntKind: sfntKind, warnings });
      else console.log(`Wrote ${label}: ${outPath}`);
      return;
    }

    case "coverage": {
      if (args["list-languages"]) {
        if (asJson) writeJsonSuccess("coverage", { mode: "list-languages", languages: actions.getLanguages() });
        else actions.printLanguages();
        return;
      }
      requireFontPath(args);
      if (args.missing) {
        const lang = args.lang != null ? String(args.lang) : null;
        if (!lang) throw usageError("coverage --missing requires --lang <code>.");
        if (asJson) writeJsonSuccess("coverage", { mode: "missing", payload: actions.getMissingCharsPayload(font, lang) });
        else actions.printMissingChars(font, lang, false);
        return;
      }
      if (args.supported) {
        const minCoveragePct = parseMinCoverage(args, "min-coverage", 100);
        if (asJson) writeJsonSuccess("coverage", { mode: "supported", minCoveragePct, rows: actions.getSupportedRows(font, minCoveragePct / 100) });
        else actions.printSupportedLanguages(font, minCoveragePct / 100, false);
        return;
      }
      if (asJson) writeJsonSuccess("coverage", { mode: "all", rows: actions.getCoverageRows(font) });
      else actions.printCoverage(font, false);
      return;
    }

    case "inspect": {
      requireFontPath(args);
      const minCoveragePct = parseMinCoverage(args, "min-coverage", 90);
      const sample = args["kerning-chars"] != null
        ? String(args["kerning-chars"])
        : "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
      const limit = parseKerningLimit(args, 10);
      const options = {
        minCoveragePct,
        kerningChars: sample,
        kerningLimit: limit
      };
      if (asJson) writeJsonSuccess("inspect", actions.getOverviewData(originalBuffer, font, options));
      else actions.printOverview(originalBuffer, font, options);
      return;
    }

    case "svg": {
      requireFontPath(args);
      const parsedSvg = parseSvgOptions(args, parseBoolean);
      const svg = actions.exportSvgText(font, parsedSvg.text, parsedSvg.options);
      if (args.out) {
        const outPath = actions.resolveCwdPath(String(args.out));
        actions.writeUtf8(outPath, svg);
        if (asJson) writeJsonSuccess("svg", { outPath, textLength: parsedSvg.text.length, options: parsedSvg.options });
        else console.log(`Wrote SVG: ${outPath}`);
      } else {
        if (asJson) writeJsonSuccess("svg", { inlineSvg: svg, textLength: parsedSvg.text.length, options: parsedSvg.options });
        else console.log(svg);
      }
      return;
    }

    case "localise": {
      requireFontPath(args);
      const lang = args.lang != null ? String(args.lang) : "";
      if (!lang) throw usageError("localise requires --lang <code>.");

      const info = actions.supportsLanguage(font, lang);
      if (!info) {
        throw usageError(`Unknown language code: ${lang}`);
      }

      const outPath = args.out
        ? actions.resolveCwdPath(args.out)
        : actions.resolveDirPath(__dirname, `${actions.basenameNoExt(resolved)}-${lang}.ttf`);

      let buffer = actions.bufferFrom(originalBuffer);
      actions.updateNameTableBuffer(buffer, lang.toUpperCase());
      let reportPath = null;

      if (!info.supported) {
        const report = [];
        const composedRes = actions.composeFont(buffer, font, info.missing, report);
        buffer = composedRes.buffer;
        if (!asJson) console.log(`Composed ${composedRes.composed} glyphs for missing characters.`);
        if (report.length) {
          reportPath = `${outPath}.report.json`;
          actions.writeJson(reportPath, report);
          if (!asJson) console.log(`Composition report: ${reportPath}`);
        }
        const stillMissing = actions.supportsLanguage(actions.loadFontFromBuffer(buffer), lang);
        if (stillMissing && !stillMissing.supported) {
          if (!asJson) console.log(`Still missing (${stillMissing.missing.length}): ${stillMissing.missing.slice(0, 30).join(" ")}`);
        }
      }

      actions.writeBuffer(outPath, buffer);
      if (asJson) writeJsonSuccess("localise", { outPath, lang, initiallySupported: info.supported, reportPath });
      else console.log(`Wrote localized font: ${outPath}`);
      return;
    }

    case "subset": {
      requireFontPath(args);
      const fsTypeFlags = font.getFsTypeFlags?.() ?? [];
      if (fsTypeFlags.includes("no-subsetting")) {
        console.warn("Warning: OS/2 fsType indicates no-subsetting.");
      }

      const selectedChars = actions.collectSubsetChars({
        "subset-chars": args.chars,
        "subset-file": args.file,
        "subset-lang": args.lang,
        resolveCwdPath: actions.resolveCwdPath
      });
      if (selectedChars.length === 0) {
        throw usageError("No subset character sources provided. Use --chars and/or --file and/or --lang.");
      }

      const outPath = args.out
        ? actions.resolveCwdPath(String(args.out))
        : actions.resolveDirPath(__dirname, `${actions.basenameWithExt(resolved)}-subset.ttf`);
      const reportPath = args.report
        ? actions.resolveCwdPath(String(args.report))
        : `${outPath}.report.json`;

      let buffer = actions.bufferFrom(originalBuffer);
      actions.updateNameTableBuffer(buffer, "SUBSET");
      const workingFont = actions.loadFontFromBuffer(buffer);
      const subsetRes = actions.buildSubsetFont(buffer, workingFont, selectedChars);
      actions.writeBuffer(outPath, subsetRes.buffer);
      actions.writeJson(reportPath, subsetRes.report);

      if (asJson) {
        writeJsonSuccess("subset", { outPath, reportPath, report: subsetRes.report });
      } else {
        console.log(`Wrote subset font: ${outPath}`);
        console.log(`Subset report: ${reportPath}`);
        console.log(`Subset chars mapped: ${subsetRes.report.mappedChars}/${subsetRes.report.requestedChars}`);
        if (subsetRes.report.missingChars.length) {
          console.log(`Missing chars (${subsetRes.report.missingChars.length}): ${subsetRes.report.missingChars.slice(0, 40).join(" ")}`);
        }
        if (subsetRes.report.nonBmpChars.length) {
          console.log(`Skipped non-BMP chars (${subsetRes.report.nonBmpChars.length}): ${subsetRes.report.nonBmpChars.slice(0, 20).join(" ")}`);
        }
        console.log(`Glyph count: ${subsetRes.report.oldGlyphCount} -> ${subsetRes.report.newGlyphCount} (${subsetRes.report.reductionPct}% reduction)`);
      }
      return;
    }

    default:
      throw usageError(`Unknown command: ${command}`);
  }
}
