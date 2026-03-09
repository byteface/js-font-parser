#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { FontParser } from "../dist/data/FontParser.js";
import { FontParserWOFF } from "../dist/data/FontParserWOFF.js";
import { Table } from "../dist/table/Table.js";

function usage() {
  console.log("Usage: npm run test:font -- <url-or-local-font-path>");
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function detectMagic(bytes) {
  if (!bytes || bytes.length < 4) return "unknown";
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  const tag = String.fromCharCode(b0, b1, b2, b3);
  if (tag === "wOFF") return "woff";
  if (tag === "wOF2") return "woff2";
  if (tag === "OTTO") return "otf";
  if (tag === "true") return "ttf";
  if (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) return "ttf";
  return "unknown";
}

async function readSource(input) {
  if (isHttpUrl(input)) {
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${input}`);
    }
    const buffer = await response.arrayBuffer();
    return {
      source: input,
      bytes: new Uint8Array(buffer),
      isUrl: true
    };
  }

  const fullPath = path.resolve(process.cwd(), input);
  const bytes = new Uint8Array(await fs.readFile(fullPath));
  return {
    source: fullPath,
    bytes,
    isUrl: false
  };
}

async function parseFont(sourceInfo) {
  const magic = detectMagic(sourceInfo.bytes);
  if (magic === "woff" && sourceInfo.isUrl) {
    // WOFF frequently needs decompression; use async loader path.
    const font = await FontParserWOFF.load(sourceInfo.source);
    return { font, magic };
  }
  const font = FontParser.fromArrayBuffer(
    sourceInfo.bytes.buffer.slice(
      sourceInfo.bytes.byteOffset,
      sourceInfo.bytes.byteOffset + sourceInfo.bytes.byteLength
    )
  );
  return { font, magic };
}

function runSmoke(font) {
  const out = {
    glyphCount: typeof font.getNumGlyphs === "function" ? font.getNumGlyphs() : null,
    hasTables: {
      cmap: !!font.getTableByType?.(Table.cmap),
      head: !!font.getTableByType?.(Table.head),
      hhea: !!font.getTableByType?.(Table.hhea),
      hmtx: !!font.getTableByType?.(Table.hmtx),
      gsub: !!font.getTableByType?.(Table.GSUB),
      gpos: !!font.getTableByType?.(Table.GPOS),
      cff: !!font.getTableByType?.(Table.CFF),
      cff2: !!font.getTableByType?.(Table.CFF2),
      colr: !!font.getTableByType?.(Table.COLR),
      svg: !!font.getTableByType?.(Table.SVG)
    },
    glyphChecks: {},
    sampleOutlineIssues: [],
    diagnostics: []
  };

  const chars = ["A", "a", "0", " ", "H"];
  for (const ch of chars) {
    const idx = font.getGlyphIndexByChar?.(ch) ?? null;
    out.glyphChecks[ch] = idx;
  }

  if (typeof font.layoutString === "function") {
    const laidOut = font.layoutString("Hello world", {
      gsubFeatures: ["liga"],
      scriptTags: ["DFLT", "latn"],
      gpos: true,
      gposFeatures: ["kern", "mark", "mkmk", "curs"]
    });
    out.layoutGlyphs = laidOut.length;
  }

  // Catch visual regressions where parsing succeeds but core sample glyphs have empty outlines.
  const sample = "hello world";
  for (const ch of sample) {
    if (ch.trim().length === 0) continue;
    const glyphIndex = font.getGlyphIndexByChar?.(ch);
    const glyph = glyphIndex != null ? font.getGlyph?.(glyphIndex) : null;
    const pointCount = glyph?.getPointCount?.() ?? 0;
    if (!glyph || pointCount <= 0) {
      out.sampleOutlineIssues.push({ ch, glyphIndex, pointCount });
    }
  }

  if (typeof font.getMetadata === "function") {
    const meta = font.getMetadata();
    out.metadata = {
      family: meta?.familyName ?? null,
      fullName: meta?.fullName ?? null,
      weightClass: meta?.weightClass ?? null
    };
  }

  if (typeof font.getDiagnostics === "function") {
    out.diagnostics = font.getDiagnostics().slice(0, 20);
  }

  return out;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    usage();
    process.exit(2);
  }

  console.log(`[test:font] loading: ${input}`);

  try {
    const sourceInfo = await readSource(input);
    const { font, magic } = await parseFont(sourceInfo);
    const report = runSmoke(font);
    const hasIssues = report.sampleOutlineIssues.length > 0;
    console.log(
      JSON.stringify(
        {
          ok: !hasIssues,
          source: sourceInfo.source,
          sourceType: sourceInfo.isUrl ? "url" : "file",
          detectedMagic: magic,
          report
        },
        null,
        2
      )
    );
    if (hasIssues) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          source: input,
          error: String(error?.stack || error)
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

await main();
