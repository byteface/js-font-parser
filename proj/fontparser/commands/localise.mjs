import { Table } from "../../../dist/table/Table.js";
import { buildFormat4, getTableData, rebuildFontWithTables } from "../lib/font-utils.mjs";

function makeCompositeGlyph(baseGlyph, markGlyph, markDx, markDy, markTransform) {
  const ARG_1_AND_2_ARE_WORDS = 0x0001;
  const ARGS_ARE_XY_VALUES = 0x0002;
  const MORE_COMPONENTS = 0x0020;
  const WE_HAVE_A_2X2 = 0x0080;

  const parts = [];
  const header = Buffer.alloc(10);
  header.writeInt16BE(-1, 0);

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
  "ș": ["s", "\u0326"], "Ș": ["S", "\u0326"],
  "ț": ["t", "\u0326"], "Ț": ["T", "\u0326"],
  "ź": ["z", "\u0301"], "Ź": ["Z", "\u0301"],
  "ż": ["z", "\u0307"], "Ż": ["Z", "\u0307"],
  "ž": ["z", "\u030C"], "Ž": ["Z", "\u030C"],
  "ł": ["l", "\u0335"], "Ł": ["L", "\u0335"]
};

export function composeFont(buffer, font, targetChars, report) {
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
    const clamp16 = (v) => Math.max(-32768, Math.min(32767, Math.round(v ?? 0)));
    glyphRecords.push({ advance: clamp16(advance), lsb: clamp16(lsb) });
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

  const hmtxBuf = Buffer.from(hmtx);
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
