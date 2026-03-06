import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ByteArray } from "../../dist/utils/ByteArray.js";
import { FontParserTTF } from "../../dist/data/FontParserTTF.js";
import { SVGFont } from "../../dist/render/SVGFont.js";
import { Table } from "../../dist/table/Table.js";
import { supportsLanguage } from "../../dist/utils/LanguageSupport.js";
import { parseArgs, parseBoolean, printUsage } from "./cli/args.mjs";
import { runCli } from "./cli/runner.mjs";
import { printCoverage, printSupportedLanguages, printMissingChars, printLanguages } from "./commands/languages.mjs";
import { printMetadata } from "./commands/meta.mjs";
import { printOverview as printOverviewCommand } from "./commands/overview.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFont(pathLike) {
  const data = fs.readFileSync(pathLike);
  return new FontParserTTF(new ByteArray(new Uint8Array(data)));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function uniqueChars(str) {
  return Array.from(new Set(Array.from(str || "")));
}

function readCharsFromFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return uniqueChars(data.replace(/\s+/g, ""));
}

function charsFromLanguage(code) {
  const lang = listLanguages().find(l => l.code === code);
  if (!lang) return null;
  return uniqueChars(lang.required);
}

function updateNameTableBuffer(fontBuffer, newSuffix) {
  const view = new DataView(fontBuffer.buffer, fontBuffer.byteOffset, fontBuffer.byteLength);
  const numTables = view.getUint16(4);
  let offset = 12;
  let headOffset = 0;
  let headLength = 0;
  let nameOffset = 0;
  let nameLength = 0;
  const records = [];

  for (let i = 0; i < numTables; i++) {
    const tag = view.getUint32(offset);
    const checkSum = view.getUint32(offset + 4);
    const tableOffset = view.getUint32(offset + 8);
    const tableLength = view.getUint32(offset + 12);
    records.push({ tag, checkSum, tableOffset, tableLength, recordOffset: offset });
    if (tag === Table.head) {
      headOffset = tableOffset;
      headLength = tableLength;
    }
    if (tag === Table.pName) {
      nameOffset = tableOffset;
      nameLength = tableLength;
    }
    offset += 16;
  }

  if (!nameOffset) {
    throw new Error("No name table found");
  }

  const nameView = new DataView(fontBuffer.buffer, fontBuffer.byteOffset + nameOffset, nameLength);
  const format = nameView.getUint16(0);
  const count = nameView.getUint16(2);
  const stringOffset = nameView.getUint16(4);
  const stringsStart = nameOffset + stringOffset;

  for (let i = 0; i < count; i++) {
    const recOffset = 6 + i * 12;
    const platformId = nameView.getUint16(recOffset);
    const nameId = nameView.getUint16(recOffset + 6);
    const length = nameView.getUint16(recOffset + 8);
    const offsetStr = nameView.getUint16(recOffset + 10);

    if (nameId === 1 || nameId === 4) {
      const strPos = stringsStart + offsetStr;
      const oldBytes = fontBuffer.slice(strPos, strPos + length);
      let decoded = "";
      if (platformId === 3) {
        for (let j = 0; j < oldBytes.length; j += 2) {
          decoded += String.fromCharCode((oldBytes[j] << 8) | oldBytes[j + 1]);
        }
      } else {
        decoded = Buffer.from(oldBytes).toString("latin1");
      }
      const newStr = (decoded + " " + newSuffix).slice(0, decoded.length).padEnd(decoded.length, " ");

      const outBytes = Buffer.alloc(length);
      if (platformId === 3) {
        for (let j = 0; j < newStr.length; j++) {
          const code = newStr.charCodeAt(j);
          outBytes[j * 2] = (code >> 8) & 0xff;
          outBytes[j * 2 + 1] = code & 0xff;
        }
      } else {
        outBytes.write(newStr, 0, "latin1");
      }
      outBytes.copy(fontBuffer, strPos);
    }
  }

  // Recompute checksums
  const sumTable = (start, length) => {
    const padded = Math.ceil(length / 4) * 4;
    let sum = 0;
    for (let i = 0; i < padded; i += 4) {
      const a = start + i;
      const v = (fontBuffer[a] << 24) | (fontBuffer[a + 1] << 16) | (fontBuffer[a + 2] << 8) | (fontBuffer[a + 3] || 0);
      sum = (sum + (v >>> 0)) >>> 0;
    }
    return sum >>> 0;
  };

  // Zero checksumAdjustment
  if (headOffset) {
    const adjOffset = headOffset + 8;
    view.setUint32(adjOffset, 0);
  }

  records.forEach(r => {
    const checksum = sumTable(r.tableOffset, r.tableLength);
    view.setUint32(r.recordOffset + 4, checksum);
  });

  const total = sumTable(0, fontBuffer.length);
  const checksumAdjustment = (0xB1B0AFBA - total) >>> 0;
  if (headOffset) {
    view.setUint32(headOffset + 8, checksumAdjustment);
  }
}

function getTableRecords(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const numTables = view.getUint16(4);
  const records = [];
  let offset = 12;
  for (let i = 0; i < numTables; i++) {
    const tag = view.getUint32(offset);
    const checkSum = view.getUint32(offset + 4);
    const tableOffset = view.getUint32(offset + 8);
    const tableLength = view.getUint32(offset + 12);
    records.push({ tag, checkSum, tableOffset, tableLength, recordOffset: offset });
    offset += 16;
  }
  return { view, records, numTables };
}

function getTableData(buffer, tag) {
  const { records } = getTableRecords(buffer);
  const rec = records.find(r => r.tag === tag);
  if (!rec) return null;
  return buffer.slice(rec.tableOffset, rec.tableOffset + rec.tableLength);
}

function tagToString(tag) {
  return String.fromCharCode(
    (tag >>> 24) & 0xff,
    (tag >>> 16) & 0xff,
    (tag >>> 8) & 0xff,
    tag & 0xff
  );
}

function printTables(buffer, asJson = false) {
  const { records } = getTableRecords(buffer);
  const rows = records
    .map(r => ({
      tag: tagToString(r.tag),
      checksum: `0x${r.checkSum.toString(16).padStart(8, "0")}`,
      offset: r.tableOffset,
      length: r.tableLength
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  const totalLength = rows.reduce((acc, r) => acc + r.length, 0);
  console.log(`Tables (${rows.length}) total length: ${totalLength} bytes`);
  rows.forEach(r => {
    console.log(`${r.tag.padEnd(6)} off:${String(r.offset).padStart(8)}  len:${String(r.length).padStart(8)}  sum:${r.checksum}`);
  });
}

function setUint16(view, offset, value) {
  view.setUint16(offset, value);
}

function makeCompositeGlyph(baseGlyph, markGlyph, markDx, markDy, markTransform) {
  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const ARGS_ARE_XY_VALUES = 0x0002;
  const MORE_COMPONENTS = 0x0020;
  const WE_HAVE_A_2X2 = 0x0080;

  const parts = [];
  const header = Buffer.alloc(10);
  header.writeInt16BE(-1, 0); // numberOfContours = -1 for composite

  const xMin = Math.min(baseGlyph.xMin, markGlyph.xMin + markDx);
  const yMin = Math.min(baseGlyph.yMin, markGlyph.yMin + markDy);
  const xMax = Math.max(baseGlyph.xMax, markGlyph.xMax + markDx);
  const yMax = Math.max(baseGlyph.yMax, markGlyph.yMax + markDy);
  header.writeInt16BE(xMin, 2);
  header.writeInt16BE(yMin, 4);
  header.writeInt16BE(xMax, 6);
  header.writeInt16BE(yMax, 8);
  parts.push(header);

  const comp1 = Buffer.alloc(8);
  comp1.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES | MORE_COMPONENTS, 0);
  comp1.writeUInt16BE(baseGlyph.glyphId, 2);
  comp1.writeInt16BE(0, 4);
  comp1.writeInt16BE(0, 6);
  parts.push(comp1);

  if (markTransform) {
    const comp2 = Buffer.alloc(16);
    comp2.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES | WE_HAVE_A_2X2, 0);
    comp2.writeUInt16BE(markGlyph.glyphId, 2);
    comp2.writeInt16BE(markDx, 4);
    comp2.writeInt16BE(markDy, 6);
    comp2.writeInt16BE(markTransform.a, 8);
    comp2.writeInt16BE(markTransform.b, 10);
    comp2.writeInt16BE(markTransform.c, 12);
    comp2.writeInt16BE(markTransform.d, 14);
    parts.push(comp2);
  } else {
    const comp2 = Buffer.alloc(8);
    comp2.writeUInt16BE(ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES, 0);
    comp2.writeUInt16BE(markGlyph.glyphId, 2);
    comp2.writeInt16BE(markDx, 4);
    comp2.writeInt16BE(markDy, 6);
    parts.push(comp2);
  }

  let glyph = Buffer.concat(parts);
  const pad = (4 - (glyph.length % 4)) % 4;
  if (pad) glyph = Buffer.concat([glyph, Buffer.alloc(pad)]);
  return glyph;
}

function makeCompositeFromComponent(comp, bbox) {
  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const ARGS_ARE_XY_VALUES = 0x0002;
  const WE_HAVE_A_SCALE = 0x0008;
  const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
  const WE_HAVE_A_2X2 = 0x0080;

  const header = Buffer.alloc(10);
  header.writeInt16BE(-1, 0);
  header.writeInt16BE(bbox.xMin, 2);
  header.writeInt16BE(bbox.yMin, 4);
  header.writeInt16BE(bbox.xMax, 6);
  header.writeInt16BE(bbox.yMax, 8);

  let flags = ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES;
  let extra = Buffer.alloc(0);
  if (comp.scale01 !== 0 || comp.scale10 !== 0) {
    flags |= WE_HAVE_A_2X2;
    extra = Buffer.alloc(8);
    extra.writeInt16BE(Math.round(comp.xscale * 16384), 0);
    extra.writeInt16BE(Math.round(comp.scale01 * 16384), 2);
    extra.writeInt16BE(Math.round(comp.scale10 * 16384), 4);
    extra.writeInt16BE(Math.round(comp.yscale * 16384), 6);
  } else if (comp.xscale !== comp.yscale) {
    flags |= WE_HAVE_AN_X_AND_Y_SCALE;
    extra = Buffer.alloc(4);
    extra.writeInt16BE(Math.round(comp.xscale * 16384), 0);
    extra.writeInt16BE(Math.round(comp.yscale * 16384), 2);
  } else if (comp.xscale !== 1) {
    flags |= WE_HAVE_A_SCALE;
    extra = Buffer.alloc(2);
    extra.writeInt16BE(Math.round(comp.xscale * 16384), 0);
  }

  const compBuf = Buffer.alloc(8);
  compBuf.writeUInt16BE(flags, 0);
  compBuf.writeUInt16BE(comp.glyphIndex, 2);
  compBuf.writeInt16BE(comp.xtranslate, 4);
  compBuf.writeInt16BE(comp.ytranslate, 6);

  let glyph = Buffer.concat([header, compBuf, extra]);
  const pad = (4 - (glyph.length % 4)) % 4;
  if (pad) glyph = Buffer.concat([glyph, Buffer.alloc(pad)]);
  return glyph;
}

function componentBbox(font, comp) {
  const desc = font.getTableByType(Table.glyf)?.getDescription?.(comp.glyphIndex);
  if (!desc) return null;
  const xMin = desc.getXMinimum();
  const xMax = desc.getXMaximum();
  const yMin = desc.getYMinimum();
  const yMax = desc.getYMaximum();
  const corners = [
    { x: xMin, y: yMin },
    { x: xMin, y: yMax },
    { x: xMax, y: yMin },
    { x: xMax, y: yMax }
  ].map(p => ({
    x: comp.scaleX(p.x, p.y) + comp.xtranslate,
    y: comp.scaleY(p.x, p.y) + comp.ytranslate
  }));
  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  return {
    xMin: Math.min(...xs),
    yMin: Math.min(...ys),
    xMax: Math.max(...xs),
    yMax: Math.max(...ys)
  };
}

function bboxFromGlyph(font, glyphId) {
  const glyph = font.getGlyph(glyphId);
  if (!glyph || !glyph.points) return null;
  const pts = glyph.points.slice(0, Math.max(0, glyph.getPointCount() - 2));
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  return {
    glyphId,
    xMin: xs.length ? Math.min(...xs) : 0,
    yMin: ys.length ? Math.min(...ys) : 0,
    xMax: xs.length ? Math.max(...xs) : 0,
    yMax: ys.length ? Math.max(...ys) : 0
  };
}

function buildSimpleGlyphFromContours(contours) {
  let pointIndex = 0;
  const endPts = [];
  const points = [];
  contours.forEach(contour => {
    contour.forEach(pt => points.push({ x: pt.x, y: pt.y, onCurve: !!pt.onCurve }));
    pointIndex += contour.length;
    endPts.push(pointIndex - 1);
  });
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const bboxRaw = {
    xMin: xs.length ? Math.min(...xs) : 0,
    yMin: ys.length ? Math.min(...ys) : 0,
    xMax: xs.length ? Math.max(...xs) : 0,
    yMax: ys.length ? Math.max(...ys) : 0
  };
  const shiftX = -bboxRaw.xMin;
  const shiftY = -bboxRaw.yMin;
  points.forEach(p => {
    p.x = p.x + shiftX;
    p.y = p.y + shiftY;
  });
  const bbox = {
    xMin: 0,
    yMin: 0,
    xMax: bboxRaw.xMax + shiftX,
    yMax: bboxRaw.yMax + shiftY
  };

  const header = Buffer.alloc(10);
  header.writeInt16BE(contours.length, 0);
  header.writeInt16BE(bbox.xMin, 2);
  header.writeInt16BE(bbox.yMin, 4);
  header.writeInt16BE(bbox.xMax, 6);
  header.writeInt16BE(bbox.yMax, 8);

  const endPtsBuf = Buffer.alloc(endPts.length * 2);
  endPts.forEach((v, i) => endPtsBuf.writeUInt16BE(v, i * 2));

  const instrLen = Buffer.alloc(2);
  instrLen.writeUInt16BE(0, 0);

  const flags = [];
  for (const pt of points) {
    flags.push(pt.onCurve ? 0x01 : 0x00);
  }
  const flagsBuf = Buffer.from(flags);

  const xDeltas = [];
  const yDeltas = [];
  let prevX = 0;
  let prevY = 0;
  for (const pt of points) {
    const dx = Math.max(-32768, Math.min(32767, Math.round(pt.x - prevX)));
    const dy = Math.max(-32768, Math.min(32767, Math.round(pt.y - prevY)));
    xDeltas.push(dx);
    yDeltas.push(dy);
    prevX = pt.x;
    prevY = pt.y;
  }
  const xyBuf = Buffer.alloc(xDeltas.length * 4);
  let p = 0;
  for (let i = 0; i < xDeltas.length; i++) {
    xyBuf.writeInt16BE(xDeltas[i], p); p += 2;
  }
  for (let i = 0; i < yDeltas.length; i++) {
    xyBuf.writeInt16BE(yDeltas[i], p); p += 2;
  }

  let glyph = Buffer.concat([header, endPtsBuf, instrLen, flagsBuf, xyBuf]);
  const pad = (4 - (glyph.length % 4)) % 4;
  if (pad) glyph = Buffer.concat([glyph, Buffer.alloc(pad)]);
  return { glyph, bbox };
}

function extractTopContoursFromGlyph(font, glyphId) {
  const glyph = font.getGlyph(glyphId);
  if (!glyph || !glyph.points) return null;
  const total = Math.max(0, glyph.getPointCount() - 2);
  const contours = [];
  let current = [];
  for (let i = 0; i < total; i++) {
    const pt = glyph.points[i];
    current.push(pt);
    if (pt.endOfContour) {
      contours.push(current);
      current = [];
    }
  }
  if (!contours.length) return null;
  const xs = glyph.points.slice(0, total).map(p => p.x);
  const ys = glyph.points.slice(0, total).map(p => p.y);
  const glyphBox = {
    xMin: xs.length ? Math.min(...xs) : 0,
    yMin: ys.length ? Math.min(...ys) : 0,
    xMax: xs.length ? Math.max(...xs) : 0,
    yMax: ys.length ? Math.max(...ys) : 0
  };
  const height = glyphBox.yMax - glyphBox.yMin || 1;
  const threshold = glyphBox.yMin + height * 0.6;
  const contourBoxes = contours.map(c => {
    const xsC = c.map(p => p.x);
    const ysC = c.map(p => p.y);
    return {
      contour: c,
      box: {
        xMin: Math.min(...xsC),
        yMin: Math.min(...ysC),
        xMax: Math.max(...xsC),
        yMax: Math.max(...ysC)
      }
    };
  });
  let selected = contourBoxes
    .filter(c => c.box.yMin >= threshold)
    .filter(c => (c.box.yMax - c.box.yMin) <= height * 0.45)
    .map(c => c.contour);
  if (!selected.length) {
    contourBoxes.sort((a, b) => {
      const aH = a.box.yMax - a.box.yMin;
      const bH = b.box.yMax - b.box.yMin;
      if (b.box.yMax !== a.box.yMax) return b.box.yMax - a.box.yMax;
      return aH - bH;
    });
    selected = [contourBoxes[0].contour];
  }
  return selected;
}

const MARKS = {
  "\u0300": { name: "grave", pos: "above" },
  "\u0301": { name: "acute", pos: "above" },
  "\u0302": { name: "circumflex", pos: "above" },
  "\u0303": { name: "tilde", pos: "above" },
  "\u0304": { name: "macron", pos: "above" },
  "\u0306": { name: "breve", pos: "above" },
  "\u0307": { name: "dot", pos: "above" },
  "\u0308": { name: "diaeresis", pos: "above" },
  "\u030A": { name: "ring", pos: "above" },
  "\u030B": { name: "double-acute", pos: "above" },
  "\u030C": { name: "caron", pos: "above" },
  "\u0327": { name: "cedilla", pos: "below" },
  "\u0328": { name: "ogonek", pos: "below" },
  "\u0326": { name: "comma-below", pos: "below" },
  "\u0335": { name: "short-stroke", pos: "overlay" }
};

const MARK_FALLBACKS = {
  "\u0301": [".", "´", "'"],
  "\u0300": [".", "`"],
  "\u0302": ["^"],
  "\u0303": ["~"],
  "\u0304": ["-"],
  "\u0306": ["˘", "v"],
  "\u0307": ["."],
  "\u0308": [":"],
  "\u030A": ["o", "°"],
  "\u030B": ["\""],
  "\u030C": ["ˇ", "v"],
  "\u0327": [",", "."],
  "\u0328": [",", "."],
  "\u0326": [",", "."],
  "\u0335": ["-", "—"]
};

function findMarkFromExistingComposite(font, markChar) {
  const glyfTable = font.getTableByType(Table.glyf);
  if (!glyfTable?.getDescription) return null;
  for (const [composedChar, parts] of Object.entries(DECOMPOSE)) {
    if (!parts || parts[1] !== markChar) continue;
    const compGlyphId = font.getGlyphIndexByChar(composedChar);
    if (!compGlyphId) continue;
    const desc = glyfTable.getDescription(compGlyphId);
    if (!desc?.isComposite?.() || !desc.components?.length) continue;
    const last = desc.components[desc.components.length - 1];
    if (last?.glyphIndex != null) return last.glyphIndex;
  }
  return null;
}

const DOTLESS_MAP = {
  "ı": "i",
  "İ": "I"
};

const DECOMPOSE = {
  "á": ["a", "\u0301"], "Á": ["A", "\u0301"],
  "à": ["a", "\u0300"], "À": ["A", "\u0300"],
  "â": ["a", "\u0302"], "Â": ["A", "\u0302"],
  "ã": ["a", "\u0303"], "Ã": ["A", "\u0303"],
  "ä": ["a", "\u0308"], "Ä": ["A", "\u0308"],
  "å": ["a", "\u030A"], "Å": ["A", "\u030A"],
  "ā": ["a", "\u0304"], "Ā": ["A", "\u0304"],
  "ă": ["a", "\u0306"], "Ă": ["A", "\u0306"],
  "ą": ["a", "\u0328"], "Ą": ["A", "\u0328"],
  "ç": ["c", "\u0327"], "Ç": ["C", "\u0327"],
  "ć": ["c", "\u0301"], "Ć": ["C", "\u0301"],
  "č": ["c", "\u030C"], "Č": ["C", "\u030C"],
  "ď": ["d", "\u030C"], "Ď": ["D", "\u030C"],
  "ě": ["e", "\u030C"], "Ě": ["E", "\u030C"],
  "ň": ["n", "\u030C"], "Ň": ["N", "\u030C"],
  "ř": ["r", "\u030C"], "Ř": ["R", "\u030C"],
  "ť": ["t", "\u030C"], "Ť": ["T", "\u030C"],
  "ů": ["u", "\u030A"], "Ů": ["U", "\u030A"],
  "é": ["e", "\u0301"], "É": ["E", "\u0301"],
  "è": ["e", "\u0300"], "È": ["E", "\u0300"],
  "ê": ["e", "\u0302"], "Ê": ["E", "\u0302"],
  "ë": ["e", "\u0308"], "Ë": ["E", "\u0308"],
  "ě": ["e", "\u030C"], "Ě": ["E", "\u030C"],
  "ę": ["e", "\u0328"], "Ę": ["E", "\u0328"],
  "í": ["i", "\u0301"], "Í": ["I", "\u0301"],
  "ì": ["i", "\u0300"], "Ì": ["I", "\u0300"],
  "î": ["i", "\u0302"], "Î": ["I", "\u0302"],
  "ï": ["i", "\u0308"], "Ï": ["I", "\u0308"],
  "ñ": ["n", "\u0303"], "Ñ": ["N", "\u0303"],
  "ń": ["n", "\u0301"], "Ń": ["N", "\u0301"],
  "ó": ["o", "\u0301"], "Ó": ["O", "\u0301"],
  "ò": ["o", "\u0300"], "Ò": ["O", "\u0300"],
  "ô": ["o", "\u0302"], "Ô": ["O", "\u0302"],
  "õ": ["o", "\u0303"], "Õ": ["O", "\u0303"],
  "ö": ["o", "\u0308"], "Ö": ["O", "\u0308"],
  "ő": ["o", "\u030B"], "Ő": ["O", "\u030B"],
  "ú": ["u", "\u0301"], "Ú": ["U", "\u0301"],
  "ù": ["u", "\u0300"], "Ù": ["U", "\u0300"],
  "û": ["u", "\u0302"], "Û": ["U", "\u0302"],
  "ü": ["u", "\u0308"], "Ü": ["U", "\u0308"],
  "ű": ["u", "\u030B"], "Ű": ["U", "\u030B"],
  "ý": ["y", "\u0301"], "Ý": ["Y", "\u0301"],
  "ÿ": ["y", "\u0308"], "Ÿ": ["Y", "\u0308"],
  "ś": ["s", "\u0301"], "Ś": ["S", "\u0301"],
  "š": ["s", "\u030C"], "Š": ["S", "\u030C"],
  "ğ": ["g", "\u0306"], "Ğ": ["G", "\u0306"],
  "İ": ["I", "\u0307"],
  "ş": ["s", "\u0327"], "Ş": ["S", "\u0327"],
  "ă": ["a", "\u0306"], "Ă": ["A", "\u0306"],
  "ș": ["s", "\u0326"], "Ș": ["S", "\u0326"],
  "ț": ["t", "\u0326"], "Ț": ["T", "\u0326"],
  "ź": ["z", "\u0301"], "Ź": ["Z", "\u0301"],
  "ż": ["z", "\u0307"], "Ż": ["Z", "\u0307"],
  "ž": ["z", "\u030C"], "Ž": ["Z", "\u030C"],
  "ł": ["l", "\u0335"], "Ł": ["L", "\u0335"]
};

function buildFormat4(mapping) {
  const codes = Object.keys(mapping).map(n => Number(n)).filter(c => c >= 0 && c <= 0xffff).sort((a, b) => a - b);
  if (codes.length === 0) return Buffer.alloc(0);
  const ranges = [];
  let start = codes[0];
  let last = codes[0];
  for (let i = 1; i < codes.length; i++) {
    if (codes[i] === last + 1) {
      last = codes[i];
    } else {
      ranges.push([start, last]);
      start = last = codes[i];
    }
  }
  ranges.push([start, last]);
  ranges.push([0xffff, 0xffff]); // sentinel

  const segCount = ranges.length;
  const segCountX2 = segCount * 2;
  const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(segCount)));
  const entrySelector = Math.floor(Math.log2(segCount));
  const rangeShift = segCountX2 - searchRange;

  const endCode = [];
  const startCode = [];
  const idDelta = [];
  const idRangeOffset = [];
  const glyphIdArray = [];

  ranges.forEach(([s, e], i) => {
    startCode.push(s);
    endCode.push(e);
    if (s === 0xffff && e === 0xffff) {
      idDelta.push(1);
      idRangeOffset.push(0);
      return;
    }
    idDelta.push(0);
    // placeholder for idRangeOffset; filled later
    idRangeOffset.push(0);
    for (let c = s; c <= e; c++) {
      glyphIdArray.push(mapping[c] ?? 0);
    }
  });

  // Compute idRangeOffset values
  const headerSize = 16;
  const arraysSize = segCount * 2 * 4 + 2; // endCode + startCode + idDelta + idRangeOffset + reserved
  const glyphArrayStart = headerSize + arraysSize;
  let glyphIndex = 0;
  for (let i = 0; i < segCount; i++) {
    const s = startCode[i];
    const e = endCode[i];
    if (s === 0xffff && e === 0xffff) continue;
    const offset = glyphArrayStart + glyphIndex * 2 - (headerSize + segCount * 2 * 3 + 2 + i * 2);
    idRangeOffset[i] = offset;
    glyphIndex += (e - s + 1);
  }

  const length = headerSize + segCount * 2 + 2 + segCount * 2 + segCount * 2 + segCount * 2 + glyphIdArray.length * 2;
  const buf = Buffer.alloc(length);
  let p = 0;
  buf.writeUInt16BE(4, p); p += 2;
  buf.writeUInt16BE(length, p); p += 2;
  buf.writeUInt16BE(0, p); p += 2; // language
  buf.writeUInt16BE(segCountX2, p); p += 2;
  buf.writeUInt16BE(searchRange, p); p += 2;
  buf.writeUInt16BE(entrySelector, p); p += 2;
  buf.writeUInt16BE(rangeShift, p); p += 2;
  endCode.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  buf.writeUInt16BE(0, p); p += 2;
  startCode.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  idDelta.forEach(v => { buf.writeInt16BE(v, p); p += 2; });
  idRangeOffset.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  glyphIdArray.forEach(v => { buf.writeUInt16BE(v, p); p += 2; });
  return buf;
}

function rebuildFontWithTables(buffer, tableUpdates) {
  const { records } = getTableRecords(buffer);
  const tableMap = new Map(records.map(r => [r.tag, r]));

  const newTables = records.map(r => {
    const updated = tableUpdates.get(r.tag);
    if (updated) return { tag: r.tag, data: updated };
    const orig = buffer.slice(r.tableOffset, r.tableOffset + r.tableLength);
    return { tag: r.tag, data: orig };
  });

  let offset = 12 + newTables.length * 16;
  const tableRecords = [];
  const chunks = [];
  newTables.forEach(t => {
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      offset += pad;
    }
    tableRecords.push({ tag: t.tag, offset, length: t.data.length });
    chunks.push(t.data);
    offset += t.data.length;
  });

  const out = Buffer.alloc(offset);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  // sfnt header
  out.writeUInt32BE(0x00010000, 0);
  out.writeUInt16BE(newTables.length, 4);
  const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(newTables.length)));
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(Math.floor(Math.log2(newTables.length)), 8);
  out.writeUInt16BE(newTables.length * 16 - searchRange, 10);

  let recordOffset = 12;
  tableRecords.forEach(r => {
    out.writeUInt32BE(r.tag, recordOffset);
    out.writeUInt32BE(0, recordOffset + 4); // checksum placeholder
    out.writeUInt32BE(r.offset, recordOffset + 8);
    out.writeUInt32BE(r.length, recordOffset + 12);
    recordOffset += 16;
  });

  let dataOffset = 12 + newTables.length * 16;
  chunks.forEach(chunk => {
    chunk.copy(out, dataOffset);
    dataOffset += chunk.length;
  });

  const sumTable = (start, length) => {
    const padded = Math.ceil(length / 4) * 4;
    let sum = 0;
    for (let i = 0; i < padded; i += 4) {
      const a = start + i;
      const v = (out[a] << 24) | (out[a + 1] << 16) | (out[a + 2] << 8) | (out[a + 3] || 0);
      sum = (sum + (v >>> 0)) >>> 0;
    }
    return sum >>> 0;
  };

  tableRecords.forEach((r, i) => {
    const checksum = sumTable(r.offset, r.length);
    out.writeUInt32BE(checksum, 12 + i * 16 + 4);
  });

  const headRec = tableRecords.find(r => r.tag === Table.head);
  if (headRec) {
    // zero checksumAdjustment
    out.writeUInt32BE(0, headRec.offset + 8);
    const total = sumTable(0, out.length);
    const checksumAdjustment = (0xB1B0AFBA - total) >>> 0;
    out.writeUInt32BE(checksumAdjustment, headRec.offset + 8);
  }
  return out;
}

function composeFont(buffer, font, targetChars, report) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const loca = getTableData(buffer, Table.loca);
  const glyf = getTableData(buffer, Table.glyf);
  const hmtx = getTableData(buffer, Table.hmtx);
  if (!head || !hhea || !maxp || !loca || !glyf || !hmtx) {
    throw new Error("Missing required tables for compose");
  }

  const indexToLocFormat = head.indexToLocFormat;
  const numGlyphs = maxp.numGlyphs;
  const numberOfHMetrics = hhea.numberOfHMetrics;

  const offsets = [];
  const locaView = new DataView(loca.buffer, loca.byteOffset, loca.byteLength);
  if (indexToLocFormat === 0) {
    for (let i = 0; i < numGlyphs + 1; i++) offsets.push(locaView.getUint16(i * 2) * 2);
  } else {
    for (let i = 0; i < numGlyphs + 1; i++) offsets.push(locaView.getUint32(i * 4));
  }

  const glyphRecords = [];
  const newMapping = {};
  let newGlyf = Buffer.from(glyf);
  let newOffsets = offsets.slice(0, -1);
  let newNumGlyphs = numGlyphs;
  const generatedBbox = new Map();

  const addGlyphBuffer = (glyphBuf, bbox, advance, lsb) => {
    const start = newGlyf.length;
    newGlyf = Buffer.concat([newGlyf, glyphBuf]);
    newOffsets.push(start);
    newNumGlyphs++;
    const clamp16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v)));
    glyphRecords.push({ advance: clamp16(advance ?? 0), lsb: clamp16(lsb ?? 0) });
    const gid = newNumGlyphs - 1;
    if (bbox) generatedBbox.set(gid, { ...bbox, glyphId: gid });
    return gid;
  };

  const baseGap = Math.round((head.unitsPerEm ?? 1000) * 0.05);

  targetChars.forEach(ch => {
    if (font.getGlyphIndexByChar(ch)) return;
    const dotlessBase = DOTLESS_MAP[ch];
    if (dotlessBase) {
      const baseId = font.getGlyphIndexByChar(dotlessBase);
      const glyfTable = font.getTableByType(Table.glyf);
      if (baseId != null && glyfTable?.getDescription) {
        const desc = glyfTable.getDescription(baseId);
        if (desc?.isComposite?.() && desc.components?.length) {
          const comps = desc.components;
          const withBbox = comps.map(c => ({ comp: c, box: componentBbox(font, c) })).filter(c => c.box);
          if (withBbox.length) {
            withBbox.sort((a, b) => (a.box.yMax - b.box.yMax));
            const selected = withBbox[0];
            const glyphBuf = makeCompositeFromComponent(selected.comp, selected.box);
            const start = newGlyf.length;
            newGlyf = Buffer.concat([newGlyf, glyphBuf]);
            newOffsets.push(start);
            newNumGlyphs++;
            newMapping[ch.charCodeAt(0)] = newNumGlyphs - 1;
            const baseAdvance = font.getGlyph(baseId)?.advanceWidth ?? 0;
            const baseLsb = font.getGlyph(baseId)?.leftSideBearing ?? 0;
            const clamp16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v)));
            glyphRecords.push({ advance: clamp16(baseAdvance), lsb: clamp16(baseLsb) });
            report.push({ char: ch, method: "dotless-remove", base: dotlessBase, fallback: null });
            return;
          }
        }
      }
      const fallbackId = font.getGlyphIndexByChar("l");
      if (fallbackId != null) {
        newMapping[ch.charCodeAt(0)] = fallbackId;
        report.push({ char: ch, method: "dotless-fallback", base: "l", fallback: null });
      }
      return;
    }

    const decomp = DECOMPOSE[ch];
    if (!decomp) return;
    const [baseChar, markChar] = decomp;
    const baseId = font.getGlyphIndexByChar(baseChar);
    let markId = font.getGlyphIndexByChar(markChar);
    let markFallbackUsed = null;
    let markScale = null;
    if (markId == null) {
      const stolen = findMarkFromExistingComposite(font, markChar);
      if (stolen != null) {
        markId = stolen;
        markFallbackUsed = "composite-steal";
      }
    }
    if (markId == null && markChar === "\u030C") {
      const donorChars = ["Š", "š", "Ž", "ž", "Č", "č", "Ě", "ě", "Ň", "ň", "Ř", "ř", "Ť", "ť", "Ď", "ď"];
      for (const donor of donorChars) {
        const donorId = font.getGlyphIndexByChar(donor);
        if (!donorId) continue;
        const contours = extractTopContoursFromGlyph(font, donorId);
        if (!contours) continue;
        const { glyph, bbox } = buildSimpleGlyphFromContours(contours);
        const donorGlyph = font.getGlyph(donorId);
        const derivedId = addGlyphBuffer(glyph, bbox, donorGlyph?.advanceWidth ?? 0, donorGlyph?.leftSideBearing ?? 0);
        markId = derivedId;
        markFallbackUsed = `contour-steal:${donor}`;
        break;
      }
    }
    if (markId == null) {
      const fallbacks = MARK_FALLBACKS[markChar] || [];
      for (const fb of fallbacks) {
        const fbId = font.getGlyphIndexByChar(fb);
        if (fbId != null) {
          markId = fbId;
          markFallbackUsed = fb;
          break;
        }
      }
    }
    if (baseId == null || markId == null) return;
    const baseBox = bboxFromGlyph(font, baseId);
    const markBox = generatedBbox.get(markId) || bboxFromGlyph(font, markId);
    if (!baseBox || !markBox) return;
    const markInfo = MARKS[markChar];
    if (!markInfo) return;

    const baseCenter = (baseBox.xMin + baseBox.xMax) / 2;
    const markCenter = (markBox.xMin + markBox.xMax) / 2;
    const dx = Math.round(baseCenter - markCenter);
    let dy = 0;
    if (markInfo.pos === "above") {
      dy = Math.round(baseBox.yMax + baseGap - markBox.yMin);
    } else if (markInfo.pos === "below") {
      dy = Math.round(baseBox.yMin - baseGap - markBox.yMax);
    } else {
      const baseMid = (baseBox.yMin + baseBox.yMax) / 2;
      const markMid = (markBox.yMin + markBox.yMax) / 2;
      dy = Math.round(baseMid - markMid);
    }

    let markTransform = null;
    if (markChar === "\u030C" && markFallbackUsed === "v") {
      markScale = 0.75;
    }
    if (markScale && markScale !== 1) {
      const toFixed = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 16384)));
      markTransform = { a: toFixed(markScale), b: 0, c: 0, d: toFixed(markScale) };
    }
    if (markInfo.pos === "overlay" && markFallbackUsed) {
      const angle = -12 * (Math.PI / 180);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const toFixed = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 16384)));
      markTransform = { a: toFixed(cos), b: toFixed(sin), c: toFixed(-sin), d: toFixed(cos) };
    }

    const glyphBuf = makeCompositeGlyph(baseBox, markBox, dx, dy, markTransform);
    const start = newGlyf.length;
    newGlyf = Buffer.concat([newGlyf, glyphBuf]);
    newOffsets.push(start);
    newNumGlyphs++;
    newMapping[ch.charCodeAt(0)] = newNumGlyphs - 1;

    const baseAdvance = font.getGlyph(baseId)?.advanceWidth ?? 0;
    const baseLsb = font.getGlyph(baseId)?.leftSideBearing ?? 0;
    const clamp16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v)));
    glyphRecords.push({ advance: clamp16(baseAdvance), lsb: clamp16(baseLsb) });
    report.push({ char: ch, method: "mark-compose", base: baseChar, mark: markChar, fallback: markFallbackUsed, scale: markScale });
  });

  newOffsets.push(newGlyf.length);

  const newLoca = Buffer.alloc(indexToLocFormat === 0 ? (newNumGlyphs + 1) * 2 : (newNumGlyphs + 1) * 4);
  const locaViewNew = new DataView(newLoca.buffer, newLoca.byteOffset, newLoca.byteLength);
  for (let i = 0; i < newOffsets.length; i++) {
    if (indexToLocFormat === 0) {
      locaViewNew.setUint16(i * 2, newOffsets[i] / 2);
    } else {
      locaViewNew.setUint32(i * 4, newOffsets[i]);
    }
  }

  // update hmtx + hhea
  const hmtxBuf = Buffer.from(hmtx);
  const hmtxView = new DataView(hmtxBuf.buffer, hmtxBuf.byteOffset, hmtxBuf.byteLength);
  const newHmetrics = numberOfHMetrics + glyphRecords.length;
  const newHmtx = Buffer.alloc(newHmetrics * 4);
  hmtxBuf.copy(newHmtx, 0, 0, Math.min(hmtxBuf.length, newHmtx.length));
  let cursor = numberOfHMetrics * 4;
  glyphRecords.forEach(r => {
    newHmtx.writeUInt16BE(r.advance, cursor);
    newHmtx.writeInt16BE(r.lsb, cursor + 2);
    cursor += 4;
  });

  const newMaxp = Buffer.from(getTableData(buffer, Table.maxp));
  newMaxp.writeUInt16BE(newNumGlyphs, 4);

  const newHhea = Buffer.from(getTableData(buffer, Table.hhea));
  newHhea.writeUInt16BE(newHmetrics, 34);

  // cmap rebuild (format 4 for BMP)
  const cmap = getTableData(buffer, Table.cmap);
  const existingMap = {};
  for (let c = 0; c <= 0xffff; c++) {
    const gid = font.getGlyphIndexByChar(String.fromCharCode(c));
    if (gid) existingMap[c] = gid;
  }
  Object.assign(existingMap, newMapping);
  const format4 = buildFormat4(existingMap);
  const cmapHeader = Buffer.alloc(12);
  cmapHeader.writeUInt16BE(0, 0);
  cmapHeader.writeUInt16BE(1, 2);
  cmapHeader.writeUInt16BE(3, 4);
  cmapHeader.writeUInt16BE(1, 6);
  cmapHeader.writeUInt32BE(12, 8);
  const newCmap = Buffer.concat([cmapHeader, format4]);

  const updates = new Map();
  updates.set(Table.glyf, newGlyf);
  updates.set(Table.loca, newLoca);
  updates.set(Table.maxp, newMaxp);
  updates.set(Table.hhea, newHhea);
  updates.set(Table.hmtx, newHmtx);
  updates.set(Table.cmap, newCmap);

  return { buffer: rebuildFontWithTables(buffer, updates), composed: Object.keys(newMapping).length };
}

function getLocaOffsets(locaBuffer, indexToLocFormat, numGlyphs) {
  const offsets = [];
  const view = new DataView(locaBuffer.buffer, locaBuffer.byteOffset, locaBuffer.byteLength);
  if (indexToLocFormat === 0) {
    for (let i = 0; i <= numGlyphs; i++) offsets.push(view.getUint16(i * 2) * 2);
  } else {
    for (let i = 0; i <= numGlyphs; i++) offsets.push(view.getUint32(i * 4));
  }
  return offsets;
}

function getGlyphMetric(hmtxBuf, numberOfHMetrics, glyphId) {
  const safeNhm = Math.max(1, numberOfHMetrics);
  if (glyphId < safeNhm) {
    const p = glyphId * 4;
    return { advance: hmtxBuf.readUInt16BE(p), lsb: hmtxBuf.readInt16BE(p + 2) };
  }
  const advP = (safeNhm - 1) * 4;
  const lsbP = safeNhm * 4 + (glyphId - safeNhm) * 2;
  return { advance: hmtxBuf.readUInt16BE(advP), lsb: hmtxBuf.readInt16BE(lsbP) };
}

function remapCompositeGlyphData(rawGlyph, glyphMap) {
  if (!rawGlyph || rawGlyph.length < 10) return rawGlyph;
  const numberOfContours = rawGlyph.readInt16BE(0);
  if (numberOfContours >= 0) return rawGlyph;

  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const MORE_COMPONENTS = 0x0020;
  const WE_HAVE_A_SCALE = 0x0008;
  const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
  const WE_HAVE_A_2X2 = 0x0080;

  const out = Buffer.from(rawGlyph);
  let p = 10;
  while (p + 4 <= out.length) {
    const flags = out.readUInt16BE(p);
    const oldGlyphId = out.readUInt16BE(p + 2);
    const newGlyphId = glyphMap.get(oldGlyphId);
    if (newGlyphId == null) {
      throw new Error(`Composite glyph references dropped component glyph ${oldGlyphId}`);
    }
    out.writeUInt16BE(newGlyphId, p + 2);
    p += 4;

    p += (flags & ARG_1_AND_2_ARE_WORDS) ? 4 : 2;
    if (flags & WE_HAVE_A_SCALE) p += 2;
    else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) p += 4;
    else if (flags & WE_HAVE_A_2X2) p += 8;

    if (!(flags & MORE_COMPONENTS)) break;
  }

  return out;
}

function collectSubsetChars(args) {
  const chars = [];
  const pushUnique = (arr) => {
    for (const ch of arr) {
      if (!chars.includes(ch)) chars.push(ch);
    }
  };

  if (args["subset-chars"]) {
    pushUnique(uniqueChars(String(args["subset-chars"])));
  }
  if (args["subset-file"]) {
    const filePath = path.resolve(process.cwd(), String(args["subset-file"]));
    pushUnique(readCharsFromFile(filePath));
  }
  if (args["subset-lang"]) {
    const codes = String(args["subset-lang"]).split(",").map(s => s.trim()).filter(Boolean);
    for (const code of codes) {
      const langChars = charsFromLanguage(code);
      if (!langChars) {
        throw new Error(`Unknown language code in --subset-lang: ${code}`);
      }
      pushUnique(langChars);
    }
  }
  return chars;
}

function buildSubsetFont(buffer, font, subsetChars) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const glyf = getTableData(buffer, Table.glyf);
  const loca = getTableData(buffer, Table.loca);
  const hmtx = getTableData(buffer, Table.hmtx);
  if (!head || !hhea || !maxp || !glyf || !loca || !hmtx) {
    throw new Error("Subset currently supports TTF glyf/loca/hmtx fonts only.");
  }

  const requestedChars = uniqueChars(subsetChars.join(""));
  const selectedCharMap = new Map();
  const missingChars = [];
  const nonBmpChars = [];
  for (const ch of requestedChars) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    if (cp > 0xffff) {
      nonBmpChars.push(ch);
      continue;
    }
    const gid = font.getGlyphIndexByChar(ch);
    if (gid == null) {
      missingChars.push(ch);
      continue;
    }
    selectedCharMap.set(ch, gid);
  }

  const keep = new Set([0, ...selectedCharMap.values()]);
  const glyfTable = font.getTableByType(Table.glyf);
  const queue = Array.from(keep);
  while (queue.length > 0) {
    const gid = queue.pop();
    if (gid == null) continue;
    const desc = glyfTable?.getDescription?.(gid);
    if (!desc?.isComposite?.() || !Array.isArray(desc.components)) continue;
    for (const comp of desc.components) {
      const cgid = comp?.glyphIndex;
      if (typeof cgid !== "number") continue;
      if (keep.has(cgid)) continue;
      keep.add(cgid);
      queue.push(cgid);
    }
  }

  const oldGlyphIds = Array.from(keep).sort((a, b) => a - b);
  const glyphMap = new Map(oldGlyphIds.map((oldId, i) => [oldId, i]));

  const offsets = getLocaOffsets(loca, head.indexToLocFormat, maxp.numGlyphs);
  const glyfChunks = [];
  const newOffsets = [0];
  let cursor = 0;
  for (const oldId of oldGlyphIds) {
    const start = offsets[oldId];
    const end = offsets[oldId + 1];
    const raw = Buffer.from(glyf.slice(start, end));
    const remapped = remapCompositeGlyphData(raw, glyphMap);
    glyfChunks.push(remapped);
    cursor += remapped.length;
    const pad = (4 - (cursor % 4)) % 4;
    if (pad) {
      glyfChunks.push(Buffer.alloc(pad));
      cursor += pad;
    }
    newOffsets.push(cursor);
  }
  const newGlyf = Buffer.concat(glyfChunks);

  const indexToLocFormat = head.indexToLocFormat;
  const newLoca = Buffer.alloc(indexToLocFormat === 0 ? newOffsets.length * 2 : newOffsets.length * 4);
  const locaView = new DataView(newLoca.buffer, newLoca.byteOffset, newLoca.byteLength);
  for (let i = 0; i < newOffsets.length; i++) {
    if (indexToLocFormat === 0) locaView.setUint16(i * 2, newOffsets[i] / 2);
    else locaView.setUint32(i * 4, newOffsets[i]);
  }

  const newGlyphCount = oldGlyphIds.length;
  const newHmtx = Buffer.alloc(newGlyphCount * 4);
  for (let i = 0; i < oldGlyphIds.length; i++) {
    const metric = getGlyphMetric(hmtx, hhea.numberOfHMetrics, oldGlyphIds[i]);
    newHmtx.writeUInt16BE(metric.advance, i * 4);
    newHmtx.writeInt16BE(metric.lsb, i * 4 + 2);
  }

  const newHhea = Buffer.from(getTableData(buffer, Table.hhea));
  newHhea.writeUInt16BE(newGlyphCount, 34);
  const newMaxp = Buffer.from(getTableData(buffer, Table.maxp));
  newMaxp.writeUInt16BE(newGlyphCount, 4);

  const cmapMap = {};
  for (const [ch, oldGid] of selectedCharMap.entries()) {
    const cp = ch.codePointAt(0);
    if (cp == null || cp > 0xffff) continue;
    cmapMap[cp] = glyphMap.get(oldGid) ?? 0;
  }
  const format4 = buildFormat4(cmapMap);
  const cmapHeader = Buffer.alloc(12);
  cmapHeader.writeUInt16BE(0, 0);
  cmapHeader.writeUInt16BE(1, 2);
  cmapHeader.writeUInt16BE(3, 4);
  cmapHeader.writeUInt16BE(1, 6);
  cmapHeader.writeUInt32BE(12, 8);
  const newCmap = Buffer.concat([cmapHeader, format4]);

  const updates = new Map();
  updates.set(Table.glyf, newGlyf);
  updates.set(Table.loca, newLoca);
  updates.set(Table.hmtx, newHmtx);
  updates.set(Table.hhea, newHhea);
  updates.set(Table.maxp, newMaxp);
  updates.set(Table.cmap, newCmap);

  return {
    buffer: rebuildFontWithTables(buffer, updates),
    report: {
      requestedChars: requestedChars.length,
      mappedChars: selectedCharMap.size,
      missingChars,
      nonBmpChars,
      oldGlyphCount: maxp.numGlyphs,
      newGlyphCount,
      reductionPct: Math.round((1 - (newGlyphCount / Math.max(1, maxp.numGlyphs))) * 100),
      keptGlyphIds: oldGlyphIds
    }
  };
}

function printGlyphStats(buffer, font, asJson = false) {
  const head = font.getTableByType(Table.head);
  const hhea = font.getTableByType(Table.hhea);
  const maxp = font.getTableByType(Table.maxp);
  const loca = getTableData(buffer, Table.loca);
  if (!head || !hhea || !maxp || !loca) {
    throw new Error("Missing required tables for glyph stats.");
  }

  const offsets = getLocaOffsets(loca, head.indexToLocFormat, maxp.numGlyphs);
  const glyfTable = font.getTableByType(Table.glyf);
  let empty = 0;
  let simple = 0;
  let composite = 0;
  let unknown = 0;
  for (let gid = 0; gid < maxp.numGlyphs; gid++) {
    const start = offsets[gid];
    const end = offsets[gid + 1];
    if (end <= start) {
      empty++;
      continue;
    }
    const desc = glyfTable?.getDescription?.(gid);
    if (!desc) {
      unknown++;
      continue;
    }
    if (desc.isComposite?.()) composite++;
    else simple++;
  }

  const stats = {
    glyphCount: maxp.numGlyphs,
    numberOfHMetrics: hhea.numberOfHMetrics,
    indexToLocFormat: head.indexToLocFormat,
    simpleGlyphs: simple,
    compositeGlyphs: composite,
    emptyGlyphs: empty,
    unknownGlyphs: unknown
  };

  if (asJson) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }
  console.log("Glyph stats");
  console.log(`  glyphCount: ${stats.glyphCount}`);
  console.log(`  simpleGlyphs: ${stats.simpleGlyphs}`);
  console.log(`  compositeGlyphs: ${stats.compositeGlyphs}`);
  console.log(`  emptyGlyphs: ${stats.emptyGlyphs}`);
  console.log(`  unknownGlyphs: ${stats.unknownGlyphs}`);
  console.log(`  numberOfHMetrics: ${stats.numberOfHMetrics}`);
  console.log(`  indexToLocFormat: ${stats.indexToLocFormat}`);
}

function printKerningStats(font, chars, limit = 20, asJson = false) {
  const charList = uniqueChars(chars).filter(ch => ch !== " ");
  if (charList.length < 2) {
    throw new Error("Kerning stats requires at least 2 unique non-space characters.");
  }

  const rows = [];
  let nonZeroPairs = 0;
  let negativePairs = 0;
  let positivePairs = 0;
  for (const left of charList) {
    for (const right of charList) {
      const value = font.getKerningValue(left, right) || 0;
      if (value === 0) continue;
      nonZeroPairs++;
      if (value < 0) negativePairs++;
      if (value > 0) positivePairs++;
      rows.push({ pair: `${left}${right}`, value });
    }
  }

  const byMagnitude = rows.slice().sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, limit);
  const topNegative = rows.slice().sort((a, b) => a.value - b.value).slice(0, limit);
  const topPositive = rows.slice().sort((a, b) => b.value - a.value).slice(0, limit);
  const kernTable = font.getTableByType?.(Table.kern);
  const gposTable = font.getTableByType?.(Table.GPOS);

  const stats = {
    sampleChars: charList.join(""),
    sampleCharCount: charList.length,
    testedPairs: charList.length * charList.length,
    nonZeroPairs,
    negativePairs,
    positivePairs,
    hasKernTable: Boolean(kernTable),
    hasGposTable: Boolean(gposTable),
    topByMagnitude: byMagnitude,
    topNegative,
    topPositive
  };

  if (asJson) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("Kerning stats");
  console.log(`  sampleCharCount: ${stats.sampleCharCount}`);
  console.log(`  testedPairs: ${stats.testedPairs}`);
  console.log(`  nonZeroPairs: ${stats.nonZeroPairs} (negative:${stats.negativePairs} positive:${stats.positivePairs})`);
  console.log(`  tables: kern:${stats.hasKernTable ? "yes" : "no"} gpos:${stats.hasGposTable ? "yes" : "no"}`);
  if (stats.topByMagnitude.length > 0) {
    console.log(`  strongest pairs: ${stats.topByMagnitude.map(r => `${r.pair}:${r.value}`).join(" | ")}`);
  } else {
    console.log("  strongest pairs: (none in sampled characters)");
  }
}

function printOverview(buffer, font, options = {}) {
  return printOverviewCommand(buffer, font, options, {
    printMetadata,
    printGlyphStats,
    printTables,
    printSupportedLanguages,
    printKerningStats
  });
}

function exportSvgText(font, text, options = {}) {
  const lines = String(text).replace(/\\n/g, "\n").split("\n");
  const head = font.getTableByType(Table.head);
  const unitsPerEm = head?.unitsPerEm ?? 1000;
  const ascent = font.getAscent();
  const descent = font.getDescent();

  const fontSize = options.fontSize ?? 96;
  const scale = fontSize / unitsPerEm;
  const lineHeightFactor = options.lineHeight ?? 1.2;
  const letterSpacing = options.letterSpacing ?? 0;
  const useKerning = options.useKerning ?? true;
  const padding = options.padding ?? 24;
  const fill = options.fill ?? "#111111";
  const stroke = options.stroke ?? "none";
  const strokeWidth = options.strokeWidth ?? 0;
  const background = options.background ?? null;

  const fontHeightPx = (ascent - descent) * scale;
  const lineHeightPx = Math.max(fontHeightPx, fontHeightPx * lineHeightFactor);

  const lineAdvances = [];
  const linePaths = [];
  for (const line of lines) {
    let penX = 0;
    let pathD = "";
    let prev = null;
    for (const ch of line) {
      const glyph = font.getGlyphByChar(ch);
      if (!glyph) {
        penX += letterSpacing + (fontSize * 0.33);
        prev = null;
        continue;
      }
      if (useKerning && prev != null) {
        const kern = font.getKerningValue(prev, ch) || 0;
        penX += kern * scale;
      }
      pathD += SVGFont.glyphToPath(glyph, scale, penX, 0);
      penX += glyph.advanceWidth * scale + letterSpacing;
      prev = ch;
    }
    lineAdvances.push(Math.max(1, penX));
    linePaths.push(pathD);
  }

  const width = Math.ceil(Math.max(1, ...lineAdvances) + padding * 2);
  const height = Math.ceil(Math.max(1, lines.length * lineHeightPx) + padding * 2);
  const viewBox = `0 0 ${width} ${height}`;

  const pathEls = [];
  for (let i = 0; i < linePaths.length; i++) {
    const baselineY = padding + (ascent * scale) + (i * lineHeightPx);
    pathEls.push(`<path d="${linePaths[i]}" transform="translate(${padding}, ${baselineY})" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"/>`);
  }

  const bgRect = background
    ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(background)}"/>`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">` +
    `${bgRect}${pathEls.join("")}</svg>`
  );
}

async function main() {
  const args = parseArgs();
  const fontPath = args.font;
  if (!fontPath) {
    printUsage();
    process.exit(1);
  }
  const resolved = path.resolve(process.cwd(), fontPath);
  const font = loadFont(resolved);
  const originalBuffer = Buffer.from(fs.readFileSync(resolved));
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
    basenameNoExt: (p) => path.basename(p, path.extname(p)),
    basenameWithExt: (p) => path.basename(p, path.extname(p)),
    bufferFrom: (b) => Buffer.from(b),
    loadFontFromBuffer: (buffer) => new FontParserTTF(new ByteArray(new Uint8Array(buffer))),
    writeBuffer: (target, buffer) => fs.writeFileSync(target, buffer),
    writeUtf8: (target, data) => fs.writeFileSync(target, data, "utf8"),
    writeJson: (target, data) => fs.writeFileSync(target, JSON.stringify(data, null, 2))
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
