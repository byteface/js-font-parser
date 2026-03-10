export async function runCli(args, ctx, actions) {
  const { font, originalBuffer, resolved, __dirname, parseBoolean } = ctx;

  if (args.convert != null) {
    const mode = String(args.convert).toLowerCase();
    if (!["woff", "sfnt", "ttf", "otf"].includes(mode)) {
      throw new Error("--convert must be one of: woff, sfnt, ttf, otf.");
    }
    const inType = actions.detectInputType(originalBuffer);
    if (mode === "woff") {
      if (inType !== "sfnt") {
        throw new Error("--convert woff expects TTF/OTF sfnt input.");
      }
      const woffBuffer = actions.convertSfntToWoff(originalBuffer);
      const outPath = actions.resolveConvertOutPath(resolved, "woff", args.out);
      actions.writeBuffer(outPath, woffBuffer);
      console.log(`Wrote WOFF: ${outPath}`);
      return;
    }

    if (inType !== "woff") {
      throw new Error("--convert sfnt/ttf/otf expects WOFF input.");
    }
    const sfntBuffer = actions.convertWoffToSfnt(originalBuffer);
    const outPath = actions.resolveConvertOutPath(resolved, mode, args.out, sfntBuffer);
    actions.writeBuffer(outPath, sfntBuffer);
    const label = mode === "otf" ? "OTF" : (mode === "ttf" ? "TTF" : "SFNT");
    console.log(`Wrote ${label}: ${outPath}`);
    return;
  }

  if (args["list-languages"]) {
    actions.printLanguages();
  }

  if (args.coverage) {
    actions.printCoverage(font);
  }

  if (args["supported-languages"] || args["supported-languages-json"]) {
    const minCoveragePct = args["min-coverage"] != null ? Number(args["min-coverage"]) : 100;
    if (!Number.isFinite(minCoveragePct) || minCoveragePct < 0 || minCoveragePct > 100) {
      throw new Error("--min-coverage must be a number between 0 and 100.");
    }
    actions.printSupportedLanguages(font, minCoveragePct / 100, Boolean(args["supported-languages-json"]));
  }

  if (args["missing-chars"]) {
    const lang = args.lang != null ? String(args.lang) : null;
    if (!lang) {
      throw new Error("--missing-chars requires --lang <code>.");
    }
    actions.printMissingChars(font, lang, Boolean(args.json));
  }

  if (args.tables || args["tables-json"]) {
    actions.printTables(originalBuffer, Boolean(args["tables-json"]));
  }

  if (args["glyph-stats"] || args["glyph-stats-json"]) {
    actions.printGlyphStats(originalBuffer, font, Boolean(args["glyph-stats-json"]));
  }

  if (args["kerning-stats"] || args["kerning-stats-json"]) {
    const sample = args["kerning-chars"] != null
      ? String(args["kerning-chars"])
      : "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
    const limit = args["kerning-limit"] != null ? Number(args["kerning-limit"]) : 20;
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error("--kerning-limit must be a positive number.");
    }
    actions.printKerningStats(font, sample, Math.floor(limit), Boolean(args["kerning-stats-json"]));
  }

  if (args.inspect || args.overview) {
    const minCoveragePct = args["min-coverage"] != null ? Number(args["min-coverage"]) : 90;
    const sample = args["kerning-chars"] != null
      ? String(args["kerning-chars"])
      : "AVWToY.,;:!?'-_abcdefghijklmnopqrstuvwxyz";
    const limit = args["kerning-limit"] != null ? Number(args["kerning-limit"]) : 10;
    if (!Number.isFinite(minCoveragePct) || minCoveragePct < 0 || minCoveragePct > 100) {
      throw new Error("--min-coverage must be a number between 0 and 100.");
    }
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error("--kerning-limit must be a positive number.");
    }
    actions.printOverview(originalBuffer, font, {
      minCoveragePct,
      kerningChars: sample,
      kerningLimit: Math.floor(limit)
    });
  }

  if (args["svg-text"] != null) {
    const text = String(args["svg-text"]);
    if (!text.length) {
      throw new Error("--svg-text must not be empty.");
    }
    const fontSize = args["svg-font-size"] != null ? Number(args["svg-font-size"]) : 96;
    const padding = args["svg-padding"] != null ? Number(args["svg-padding"]) : 24;
    const lineHeight = args["svg-line-height"] != null ? Number(args["svg-line-height"]) : 1.2;
    const letterSpacing = args["svg-letter-spacing"] != null ? Number(args["svg-letter-spacing"]) : 0;
    const strokeWidth = args["svg-stroke-width"] != null ? Number(args["svg-stroke-width"]) : 0;
    if (!Number.isFinite(fontSize) || fontSize <= 0) throw new Error("--svg-font-size must be > 0.");
    if (!Number.isFinite(padding) || padding < 0) throw new Error("--svg-padding must be >= 0.");
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) throw new Error("--svg-line-height must be > 0.");
    if (!Number.isFinite(letterSpacing)) throw new Error("--svg-letter-spacing must be numeric.");
    if (!Number.isFinite(strokeWidth) || strokeWidth < 0) throw new Error("--svg-stroke-width must be >= 0.");

    const svg = actions.exportSvgText(font, text, {
      fontSize,
      fill: args["svg-fill"] != null ? String(args["svg-fill"]) : "#111111",
      stroke: args["svg-stroke"] != null ? String(args["svg-stroke"]) : "none",
      strokeWidth,
      padding,
      lineHeight,
      letterSpacing,
      useKerning: parseBoolean(args["svg-use-kerning"], true),
      background: args["svg-bg"] != null ? String(args["svg-bg"]) : null
    });

    if (args["svg-out"]) {
      const outPath = actions.resolveCwdPath(String(args["svg-out"]));
      actions.writeUtf8(outPath, svg);
      console.log(`Wrote SVG: ${outPath}`);
    } else {
      console.log(svg);
    }
  }

  if (args.meta) {
    actions.printMetadata(font, false);
  }
  if (args["meta-json"]) {
    actions.printMetadata(font, true);
  }

  if (args.localise && args.subset) {
    throw new Error("Use either --localise or --subset in a single run.");
  }

  if (args.localise) {
    const lang = String(args.localise);
    const info = actions.supportsLanguage(font, lang);
    if (!info) {
      console.error(`Unknown language code: ${lang}`);
      process.exit(1);
    }
    const outPath = args.out ? actions.resolveCwdPath(args.out) : actions.resolveDirPath(__dirname, `${actions.basenameNoExt(resolved)}-${lang}.ttf`);
    let buffer = actions.bufferFrom(originalBuffer);
    actions.updateNameTableBuffer(buffer, lang.toUpperCase());
    if (!info.supported) {
      const report = [];
      const composedRes = actions.composeFont(buffer, font, info.missing, report);
      buffer = composedRes.buffer;
      console.log(`Composed ${composedRes.composed} glyphs for missing characters.`);
      if (report.length) {
        const reportPath = `${outPath}.report.json`;
        actions.writeJson(reportPath, report);
        console.log(`Composition report: ${reportPath}`);
      }
      const stillMissing = actions.supportsLanguage(actions.loadFontFromBuffer(buffer), lang);
      if (stillMissing && !stillMissing.supported) {
        console.log(`Still missing (${stillMissing.missing.length}): ${stillMissing.missing.slice(0, 30).join(" ")}`);
      }
    }
    actions.writeBuffer(outPath, buffer);
    console.log(`Wrote localized font: ${outPath}`);
  }

  if (args.subset) {
    const fsTypeFlags = font.getFsTypeFlags?.() ?? [];
    if (fsTypeFlags.includes("no-subsetting")) {
      console.warn("Warning: OS/2 fsType indicates no-subsetting.");
    }

    const selectedChars = actions.collectSubsetChars({ ...args, resolveCwdPath: actions.resolveCwdPath });
    if (selectedChars.length === 0) {
      throw new Error("No subset character sources provided. Use --subset-chars and/or --subset-file and/or --subset-lang.");
    }

    const outPath = args.out
      ? actions.resolveCwdPath(String(args.out))
      : actions.resolveDirPath(__dirname, `${actions.basenameWithExt(resolved)}-subset.ttf`);
    const reportPath = args["subset-report"]
      ? actions.resolveCwdPath(String(args["subset-report"]))
      : `${outPath}.report.json`;

    let buffer = actions.bufferFrom(originalBuffer);
    actions.updateNameTableBuffer(buffer, "SUBSET");
    const workingFont = actions.loadFontFromBuffer(buffer);
    const subsetRes = actions.buildSubsetFont(buffer, workingFont, selectedChars);
    actions.writeBuffer(outPath, subsetRes.buffer);
    actions.writeJson(reportPath, subsetRes.report);

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
}
