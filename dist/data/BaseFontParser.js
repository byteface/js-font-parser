import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
import { Table } from '../table/Table.js';
import { CursivePosFormat1 } from '../table/CursivePosFormat1.js';
import { MarkBasePosFormat1 } from '../table/MarkBasePosFormat1.js';
import { MarkLigPosFormat1 } from '../table/MarkLigPosFormat1.js';
import { MarkMarkPosFormat1 } from '../table/MarkMarkPosFormat1.js';
import { PairPosFormat1 } from '../table/PairPosFormat1.js';
import { PairPosFormat2 } from '../table/PairPosFormat2.js';
import { PairPosSubtable } from '../table/PairPosSubtable.js';
import { SinglePosSubtable } from '../table/SinglePosSubtable.js';
import { detectScriptTags } from '../utils/ScriptDetector.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { TrueTypeHintVM } from '../hint/TrueTypeHintVM.js';
export class BaseFontParser {
    diagnostics = [];
    diagnosticKeys = new Set();
    tableDir = null;
    tables = [];
    os2 = null;
    cmap = null;
    cbdt = null;
    cblc = null;
    glyf = null;
    cff = null;
    head = null;
    hhea = null;
    hmtx = null;
    vhea = null;
    vmtx = null;
    loca = null;
    maxp = null;
    pName = null;
    post = null;
    sbix = null;
    gsub = null;
    kern = null;
    colr = null;
    cpal = null;
    gpos = null;
    gdef = null;
    fvar = null;
    avar = null;
    svg = null;
    ebdt = null;
    eblc = null;
    ebsc = null;
    gvar = null;
    hvar = null;
    vvar = null;
    mvar = null;
    stat = null;
    cvt = null;
    fpgm = null;
    prep = null;
    variationCoords = [];
    hintingEnabled = false;
    hintingMode = 'none';
    hintingPpem = 16;
    hintVm = new TrueTypeHintVM();
    emitDiagnostic(code, level, phase, message, context, onceKey) {
        if (onceKey) {
            if (this.diagnosticKeys.has(onceKey))
                return;
            this.diagnosticKeys.add(onceKey);
        }
        this.diagnostics.push({ code, level, phase, message, context });
    }
    getDiagnostics(filter) {
        return this.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
    }
    clearDiagnostics() {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
    }
    getCmapTableForLookup() {
        return this.cmap;
    }
    getBestCmapFormatFor(codePoint) {
        const cmap = this.getCmapTableForLookup();
        if (!cmap)
            return null;
        const prefersUcs4 = codePoint > 0xffff;
        const preferred = prefersUcs4
            ? [
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 1, encodingId: 0 }
            ]
            : [
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 1, encodingId: 0 }
            ];
        for (const pref of preferred) {
            let formats = [];
            try {
                const resolved = cmap.getCmapFormats(pref.platformId, pref.encodingId);
                formats = Array.isArray(resolved) ? resolved : [];
            }
            catch {
                formats = [];
            }
            if (formats.length > 0) {
                return this.pickBestFormat(formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0]);
            }
        }
        const fallbackFormats = Array.isArray(cmap.formats) ? cmap.formats : [];
        return fallbackFormats.length > 0
            ? this.pickBestFormat(fallbackFormats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0])
            : null;
    }
    pickBestFormat(formats, order = [4, 12, 10, 8, 6, 2, 0]) {
        if (formats.length === 0)
            return null;
        const safeFormats = formats.filter((f) => !!f && typeof f === 'object');
        if (safeFormats.length === 0)
            return null;
        for (const fmt of order) {
            const found = safeFormats.find((f) => (typeof f.getFormatType === 'function' ? f.getFormatType() : f.format) === fmt);
            if (found)
                return found;
        }
        return safeFormats[0];
    }
    getOrderedCmapFormatsFor(codePoint) {
        const cmap = this.getCmapTableForLookup();
        if (!cmap)
            return [];
        const prefersUcs4 = codePoint > 0xffff;
        const preferred = prefersUcs4
            ? [
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 1, encodingId: 0 }
            ]
            : [
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 1, encodingId: 0 }
            ];
        const order = prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0];
        const seen = new Set();
        const out = [];
        const pushFormats = (formats) => {
            for (const fmtType of order) {
                for (const fmt of formats) {
                    if (!fmt || seen.has(fmt))
                        continue;
                    const resolvedType = typeof fmt.getFormatType === 'function' ? fmt.getFormatType() : fmt.format;
                    if (resolvedType === fmtType) {
                        seen.add(fmt);
                        out.push(fmt);
                    }
                }
            }
            for (const fmt of formats) {
                if (!fmt || seen.has(fmt))
                    continue;
                seen.add(fmt);
                out.push(fmt);
            }
        };
        const preferredBest = this.getBestCmapFormatFor(codePoint);
        if (preferredBest)
            pushFormats([preferredBest]);
        for (const pref of preferred) {
            let formats = [];
            try {
                const resolved = cmap.getCmapFormats(pref.platformId, pref.encodingId);
                formats = Array.isArray(resolved) ? resolved.filter((fmt) => !!fmt && typeof fmt === 'object') : [];
            }
            catch {
                formats = [];
            }
            pushFormats(formats);
        }
        const fallbackFormats = Array.isArray(cmap.formats)
            ? cmap.formats.filter((fmt) => !!fmt && typeof fmt === 'object')
            : [];
        pushFormats(fallbackFormats);
        return out;
    }
    isNonRenderingFormatCodePoint(codePoint) {
        return codePoint === 0x00AD
            || codePoint === 0x061C
            || codePoint === 0x200B
            || codePoint === 0x200E
            || codePoint === 0x200F
            || codePoint === 0x2060
            || codePoint === 0xFEFF;
    }
    getGsubTableForLayout() {
        return this.gsub;
    }
    getKernTableForLayout() {
        return this.kern;
    }
    getGposTableForLayout() {
        return this.gpos;
    }
    getGlyphByIndexForLayout(glyphIndex) {
        return this.getGlyph(glyphIndex);
    }
    isMarkGlyphForLayout(glyphIndex) {
        return this.isMarkGlyphClass(glyphIndex);
    }
    applyGposPositioningForLayout(glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }
    getNameRecordForInfo(nameId) {
        return this.getNameRecord(nameId);
    }
    getOs2TableForInfo() {
        return this.os2;
    }
    getPostTableForInfo() {
        return this.post;
    }
    getNameTableForShared() {
        return this.pName;
    }
    getOs2TableForShared() {
        return this.os2;
    }
    getPostTableForShared() {
        return this.post;
    }
    getFvarTableForShared() {
        return this.fvar;
    }
    getAvarTableForShared() {
        return this.avar;
    }
    getStatTableForShared() {
        return this.stat;
    }
    getColrTableForShared() {
        return this.colr;
    }
    getCpalTableForShared() {
        return this.cpal;
    }
    getUnitsPerEmForShared() {
        return this.getUnitsPerEm();
    }
    setVariationCoordsInternal(coords) {
        this.variationCoords = coords.slice();
    }
    onVariationCoordsUpdated(coords) {
        if (this.colr && typeof this.colr.setVariationCoords === 'function') {
            this.colr.setVariationCoords(coords);
        }
    }
    setHintingOptions(options = {}) {
        if (typeof options.enabled === 'boolean') {
            this.hintingEnabled = options.enabled;
        }
        if (options.mode === 'none' || options.mode === 'vm-experimental') {
            this.hintingMode = options.mode;
        }
        if (Number.isFinite(options.ppem)) {
            this.hintingPpem = Math.max(1, Math.round(options.ppem));
        }
    }
    getHintingOptions() {
        return {
            enabled: this.hintingEnabled,
            mode: this.hintingMode,
            ppem: this.hintingPpem
        };
    }
    getGlyphShared(i, options) {
        const maxGlyphs = options.maxGlyphs ?? null;
        if (i < 0 || (maxGlyphs != null && i >= maxGlyphs))
            return null;
        const glyf = options.glyf ?? null;
        const hmtx = options.hmtx ?? null;
        const gvar = options.gvar ?? null;
        const variationCoords = options.variationCoords ?? [];
        const cff = options.cff ?? null;
        const cff2 = options.cff2 ?? null;
        const cffIncludePhantoms = options.cffIncludePhantoms ?? true;
        const cvt = options.cvt ?? null;
        const fpgm = options.fpgm ?? null;
        const prep = options.prep ?? null;
        const description = glyf?.getDescription?.(i) ?? null;
        if (description != null) {
            let desc = description;
            let lsb = hmtx?.getLeftSideBearing?.(i) ?? 0;
            let advance = hmtx?.getAdvanceWidth?.(i) ?? 0;
            if (gvar && variationCoords.length > 0) {
                const basePointCount = description.getPointCount();
                const isComposite = description.isComposite();
                const descriptionComponents = description instanceof GlyfCompositeDescript && Array.isArray(description.components)
                    ? description.components
                    : [];
                const componentCount = isComposite && description instanceof GlyfCompositeDescript
                    ? (descriptionComponents.length > 0 ? descriptionComponents.length : basePointCount)
                    : 0;
                let transformSlotCount = 0;
                if (isComposite && description instanceof GlyfCompositeDescript) {
                    for (const comp of descriptionComponents) {
                        transformSlotCount += comp.getTransformSlotCount();
                    }
                }
                const compositePointCount = isComposite ? (componentCount + transformSlotCount) : basePointCount;
                const gvarPointCount = compositePointCount + 4;
                const deltas = gvar.getDeltasForGlyph(i, variationCoords, gvarPointCount);
                if (deltas) {
                    const base = description;
                    const fullDx = deltas.dx;
                    const fullDy = deltas.dy;
                    let dx = [];
                    let dy = [];
                    let compDx = null;
                    let compDy = null;
                    let compXScale = null;
                    let compYScale = null;
                    let compScale01 = null;
                    let compScale10 = null;
                    if (!isComposite) {
                        dx = fullDx.slice(0, basePointCount);
                        dy = fullDy.slice(0, basePointCount);
                        const touched = deltas.touched.slice(0, basePointCount);
                        while (dx.length < basePointCount)
                            dx.push(0);
                        while (dy.length < basePointCount)
                            dy.push(0);
                        while (touched.length < basePointCount)
                            touched.push(false);
                        this.applyIupDeltasShared(base, dx, dy, touched);
                    }
                    else if (base instanceof GlyfCompositeDescript) {
                        compDx = new Array(componentCount).fill(0);
                        compDy = new Array(componentCount).fill(0);
                        compXScale = new Array(componentCount).fill(0);
                        compYScale = new Array(componentCount).fill(0);
                        compScale01 = new Array(componentCount).fill(0);
                        compScale10 = new Array(componentCount).fill(0);
                        for (let c = 0; c < componentCount; c++) {
                            compDx[c] = fullDx[c] ?? 0;
                            compDy[c] = fullDy[c] ?? 0;
                        }
                        let tIndex = componentCount;
                        for (let c = 0; c < componentCount; c++) {
                            const comp = descriptionComponents[c];
                            if (!comp)
                                continue;
                            if (comp.hasTwoByTwo()) {
                                const idx1 = tIndex++;
                                const idx2 = tIndex++;
                                compXScale[c] = (fullDx[idx1] ?? 0) / 0x4000;
                                compScale01[c] = (fullDy[idx1] ?? 0) / 0x4000;
                                compScale10[c] = (fullDx[idx2] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx2] ?? 0) / 0x4000;
                            }
                            else if (comp.hasXYScale()) {
                                const idx = tIndex++;
                                compXScale[c] = (fullDx[idx] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx] ?? 0) / 0x4000;
                            }
                            else if (comp.hasScale()) {
                                const idx = tIndex++;
                                const delta = (fullDx[idx] ?? 0) / 0x4000;
                                compXScale[c] = delta;
                                compYScale[c] = delta;
                            }
                        }
                    }
                    const phantomBase = isComposite ? compositePointCount : basePointCount;
                    const lsbDelta = fullDx[phantomBase] ?? 0;
                    const rsbDelta = fullDx[phantomBase + 1] ?? 0;
                    lsb += lsbDelta;
                    advance += (rsbDelta - lsbDelta);
                    let minX = Infinity;
                    let maxX = -Infinity;
                    let minY = Infinity;
                    let maxY = -Infinity;
                    for (let p = 0; p < basePointCount; p++) {
                        const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                        const compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                        const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                        const compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                        let x = base.getXCoordinate(p);
                        let y = base.getYCoordinate(p);
                        if (comp && compIndex >= 0 && glyf) {
                            const gd = glyf.getDescription(comp.glyphIndex);
                            if (gd) {
                                const localIndex = p - comp.firstIndex;
                                const px = gd.getXCoordinate(localIndex);
                                const py = gd.getYCoordinate(localIndex);
                                const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                const ox = comp.xtranslate + (compDx?.[compIndex] ?? 0);
                                const oy = comp.ytranslate + (compDy?.[compIndex] ?? 0);
                                x = (px * xscale) + (py * scale10) + ox;
                                y = (px * scale01) + (py * yscale) + oy;
                            }
                        }
                        else {
                            const rawDx = isComposite ? (fullDx[p] ?? 0) : (dx[p] ?? 0);
                            const rawDy = isComposite ? (fullDy[p] ?? 0) : (dy[p] ?? 0);
                            const transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            const pointDx = transformed ? (transformed.dx ?? rawDx) : rawDx;
                            const pointDy = transformed ? (transformed.dy ?? rawDy) : rawDy;
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            const oy = compIndex >= 0 && compDy ? compDy[compIndex] ?? 0 : 0;
                            x = base.getXCoordinate(p) + pointDx + ox;
                            y = base.getYCoordinate(p) + pointDy + oy;
                        }
                        if (x < minX)
                            minX = x;
                        if (x > maxX)
                            maxX = x;
                        if (y < minY)
                            minY = y;
                        if (y > maxY)
                            maxY = y;
                    }
                    desc = {
                        getPointCount: () => base.getPointCount(),
                        getContourCount: () => base.getContourCount(),
                        getEndPtOfContours: (c) => base.getEndPtOfContours(c),
                        getFlags: (p) => base.getFlags(p),
                        getXCoordinate: (p) => {
                            const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                            const compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                            const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            const compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && glyf) {
                                const gd = glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    const localIndex = p - comp.firstIndex;
                                    const px = gd.getXCoordinate(localIndex);
                                    const py = gd.getYCoordinate(localIndex);
                                    const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                    const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                    const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                    const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                    const ox = comp.xtranslate + (compDx?.[compIndex] ?? 0);
                                    return (px * xscale) + (py * scale10) + ox;
                                }
                            }
                            const rawDx = isComposite ? (fullDx[p] ?? 0) : (dx[p] ?? 0);
                            const rawDy = isComposite ? (fullDy[p] ?? 0) : (dy[p] ?? 0);
                            const transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            const pointDx = transformed ? (transformed.dx ?? rawDx) : rawDx;
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            return base.getXCoordinate(p) + pointDx + ox;
                        },
                        getYCoordinate: (p) => {
                            const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                            const compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                            const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            const compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && glyf) {
                                const gd = glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    const localIndex = p - comp.firstIndex;
                                    const px = gd.getXCoordinate(localIndex);
                                    const py = gd.getYCoordinate(localIndex);
                                    const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                    const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                    const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                    const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                    const oy = comp.ytranslate + (compDy?.[compIndex] ?? 0);
                                    return (px * scale01) + (py * yscale) + oy;
                                }
                            }
                            const rawDx = isComposite ? (fullDx[p] ?? 0) : (dx[p] ?? 0);
                            const rawDy = isComposite ? (fullDy[p] ?? 0) : (dy[p] ?? 0);
                            const transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            const pointDy = transformed ? (transformed.dy ?? rawDy) : rawDy;
                            const oy = compIndex >= 0 && compDy ? compDy[compIndex] ?? 0 : 0;
                            return base.getYCoordinate(p) + pointDy + oy;
                        },
                        getXMaximum: () => (maxX !== -Infinity ? maxX : base.getXMaximum()),
                        getXMinimum: () => (minX !== Infinity ? minX : base.getXMinimum()),
                        getYMaximum: () => (maxY !== -Infinity ? maxY : base.getYMaximum()),
                        getYMinimum: () => (minY !== Infinity ? minY : base.getYMinimum()),
                        isComposite: () => base.isComposite(),
                        resolve: () => base.resolve(),
                        getInstructions: () => (typeof base.getInstructions === 'function'
                            ? base.getInstructions?.() ?? null
                            : null)
                    };
                }
            }
            const glyph = new GlyphData(desc, lsb, advance);
            this.applyHintingIfEnabled(glyph, desc, { cvt, fpgm, prep });
            return glyph;
        }
        if (cff2) {
            const cff2Desc = cff2.getGlyphDescription(i);
            if (cff2Desc) {
                return new GlyphData(cff2Desc, hmtx?.getLeftSideBearing?.(i) ?? 0, hmtx?.getAdvanceWidth?.(i) ?? 0, { isCubic: true, includePhantoms: false });
            }
        }
        if (cff) {
            const cffDesc = cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(cffDesc, hmtx?.getLeftSideBearing?.(i) ?? 0, hmtx?.getAdvanceWidth?.(i) ?? 0, { isCubic: true, includePhantoms: cffIncludePhantoms });
            }
        }
        if (glyf) {
            const lsb = hmtx?.getLeftSideBearing?.(i) ?? 0;
            const advance = hmtx?.getAdvanceWidth?.(i) ?? 0;
            const emptyDesc = {
                getPointCount: () => 0,
                getContourCount: () => 0,
                getEndPtOfContours: () => -1,
                getFlags: () => 0,
                getXCoordinate: () => 0,
                getYCoordinate: () => 0,
                getXMaximum: () => 0,
                getXMinimum: () => 0,
                getYMaximum: () => 0,
                getYMinimum: () => 0,
                isComposite: () => false,
                resolve: () => { },
                getInstructions: () => []
            };
            return new GlyphData(emptyDesc, lsb, advance);
        }
        if (hmtx) {
            const lsb = hmtx?.getLeftSideBearing?.(i) ?? 0;
            const advance = hmtx?.getAdvanceWidth?.(i) ?? 0;
            const emptyDesc = {
                getPointCount: () => 0,
                getContourCount: () => 0,
                getEndPtOfContours: () => -1,
                getFlags: () => 0,
                getXCoordinate: () => 0,
                getYCoordinate: () => 0,
                getXMaximum: () => 0,
                getXMinimum: () => 0,
                getYMaximum: () => 0,
                getYMinimum: () => 0,
                isComposite: () => false,
                resolve: () => { },
                getInstructions: () => []
            };
            return new GlyphData(emptyDesc, lsb, advance);
        }
        return null;
    }
    applyHintingIfEnabled(glyph, desc, tables) {
        if (!this.hintingEnabled || this.hintingMode !== 'vm-experimental')
            return;
        const glyphProgram = typeof desc.getInstructions === 'function' ? desc.getInstructions() : null;
        const fpgmProgram = typeof tables.fpgm?.getInstructions === 'function' ? tables.fpgm.getInstructions() : null;
        const prepProgram = typeof tables.prep?.getInstructions === 'function' ? tables.prep.getInstructions() : null;
        const cvtValues = typeof tables.cvt?.getValues === 'function' ? tables.cvt.getValues() : [];
        const result = this.hintVm.runPrograms(glyph, [fpgmProgram, prepProgram, glyphProgram], {
            cvtValues,
            ppem: this.hintingPpem
        });
        if (result.executed && result.unsupportedOpcodeCount > 0) {
            this.emitDiagnostic("HINT_VM_UNSUPPORTED_OPCODE", "info", "parse", "Hint VM ran with unsupported opcodes in vm-experimental mode.", { unsupportedOpcodeCount: result.unsupportedOpcodeCount, opCount: result.opCount }, "HINT_VM_UNSUPPORTED_OPCODE");
        }
    }
    applyIupDeltasShared(base, dx, dy, touched) {
        const pointCount = base.getPointCount();
        if (pointCount === 0)
            return;
        const endPts = [];
        for (let c = 0; c < base.getContourCount(); c++) {
            endPts.push(base.getEndPtOfContours(c));
        }
        let start = 0;
        for (const end of endPts) {
            const indices = [];
            const touchedIndices = [];
            for (let i = start; i <= end; i++) {
                indices.push(i);
                if (touched[i])
                    touchedIndices.push(i);
            }
            if (touchedIndices.length === 0) {
                start = end + 1;
                continue;
            }
            if (touchedIndices.length === 1) {
                const idx = touchedIndices[0];
                for (const j of indices) {
                    dx[j] = dx[idx];
                    dy[j] = dy[idx];
                }
                start = end + 1;
                continue;
            }
            const contour = indices;
            const total = contour.length;
            const order = touchedIndices.map(idx => contour.indexOf(idx)).sort((a, b) => a - b);
            const coordsX = contour.map(idx => base.getXCoordinate(idx));
            const coordsY = contour.map(idx => base.getYCoordinate(idx));
            for (let t = 0; t < order.length; t++) {
                const a = order[t];
                const b = order[(t + 1) % order.length];
                let idx = (a + 1) % total;
                while (idx !== b) {
                    const globalIndex = contour[idx];
                    const ax = coordsX[a];
                    const bx = coordsX[b];
                    const ay = coordsY[a];
                    const by = coordsY[b];
                    const px = coordsX[idx];
                    const py = coordsY[idx];
                    dx[globalIndex] = this.interpolateShared(ax, bx, dx[contour[a]], dx[contour[b]], px);
                    dy[globalIndex] = this.interpolateShared(ay, by, dy[contour[a]], dy[contour[b]], py);
                    idx = (idx + 1) % total;
                }
            }
            start = end + 1;
        }
    }
    interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord) {
        if (aCoord === bCoord)
            return aDelta;
        const t = (pCoord - aCoord) / (bCoord - aCoord);
        const clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    }
    getGposAttachmentAnchors(glyphId, subtables) {
        const gpos = this.getGposTableForLayout();
        if (!gpos)
            return [];
        const anchors = [];
        const activeSubtables = subtables ?? (() => {
            const lookups = gpos?.lookupList?.getLookups?.() ?? [];
            const all = [];
            for (const lookup of lookups) {
                if (!lookup)
                    continue;
                for (let i = 0; i < lookup.getSubtableCount(); i++) {
                    const st = lookup.getSubtable(i);
                    if (st)
                        all.push(st);
                }
            }
            return all;
        })();
        for (const st of activeSubtables) {
            if (st instanceof MarkBasePosFormat1) {
                const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
                if (markIndex >= 0 && st.markArray) {
                    const record = st.markArray.marks[markIndex];
                    if (record?.anchor) {
                        anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                    }
                }
                const baseIndex = st.baseCoverage?.findGlyph(glyphId) ?? -1;
                if (baseIndex >= 0 && st.baseArray) {
                    const base = st.baseArray.baseRecords[baseIndex];
                    if (base?.anchors) {
                        base.anchors.forEach((anchor, classIndex) => {
                            if (anchor) {
                                anchors.push({ type: 'base', classIndex, x: anchor.x, y: anchor.y });
                            }
                        });
                    }
                }
            }
            if (st instanceof MarkLigPosFormat1) {
                const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
                if (markIndex >= 0 && st.markArray) {
                    const record = st.markArray.marks[markIndex];
                    if (record?.anchor) {
                        anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                    }
                }
                const ligIndex = st.ligatureCoverage?.findGlyph(glyphId) ?? -1;
                if (ligIndex >= 0 && st.ligatureArray) {
                    const lig = st.ligatureArray.ligatures[ligIndex];
                    lig?.components?.forEach((component, componentIndex) => {
                        component.forEach((anchor, classIndex) => {
                            if (anchor) {
                                anchors.push({ type: 'ligature', classIndex, x: anchor.x, y: anchor.y, componentIndex });
                            }
                        });
                    });
                }
            }
            if (st instanceof MarkMarkPosFormat1) {
                const mark1Index = st.mark1Coverage?.findGlyph(glyphId) ?? -1;
                if (mark1Index >= 0 && st.mark1Array) {
                    const record = st.mark1Array.marks[mark1Index];
                    if (record?.anchor) {
                        anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                    }
                }
                const mark2Index = st.mark2Coverage?.findGlyph(glyphId) ?? -1;
                if (mark2Index >= 0 && st.mark2Array) {
                    const record = st.mark2Array.records[mark2Index];
                    record?.anchors?.forEach((anchor, classIndex) => {
                        if (anchor) {
                            anchors.push({ type: 'mark2', classIndex, x: anchor.x, y: anchor.y });
                        }
                    });
                }
            }
            if (st instanceof CursivePosFormat1) {
                const idx = st.coverage?.findGlyph(glyphId) ?? -1;
                if (idx >= 0) {
                    const record = st.entryExitRecords[idx];
                    if (record?.entry)
                        anchors.push({ type: 'cursive-entry', classIndex: 0, x: record.entry.x, y: record.entry.y });
                    if (record?.exit)
                        anchors.push({ type: 'cursive-exit', classIndex: 0, x: record.exit.x, y: record.exit.y });
                }
            }
        }
        return anchors;
    }
    applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags) {
        const gpos = this.getGposTableForLayout();
        if (!gpos)
            return;
        const subtables = gpos.getSubtablesForFeatures(gposFeatures, scriptTags);
        for (const st of subtables) {
            if (st instanceof SinglePosSubtable ||
                typeof st.getAdjustment === 'function') {
                for (let i = 0; i < glyphIndices.length; i++) {
                    if (!positioned[i])
                        continue;
                    const adj = st.getAdjustment?.(glyphIndices[i]);
                    if (!adj)
                        continue;
                    positioned[i].xOffset += adj.xPlacement ?? 0;
                    positioned[i].yOffset += adj.yPlacement ?? 0;
                    positioned[i].xAdvance += adj.xAdvance ?? 0;
                    positioned[i].yAdvance += adj.yAdvance ?? 0;
                }
            }
            if (st instanceof PairPosSubtable ||
                st instanceof PairPosFormat1 ||
                st instanceof PairPosFormat2 ||
                typeof st.getPairValue === 'function') {
                for (let i = 0; i < glyphIndices.length - 1; i++) {
                    if (!positioned[i] || !positioned[i + 1])
                        continue;
                    const pair = st.getPairValue?.(glyphIndices[i], glyphIndices[i + 1]);
                    if (!pair)
                        continue;
                    const v1 = pair.v1 || {};
                    const v2 = pair.v2 || {};
                    positioned[i].xOffset += v1.xPlacement ?? 0;
                    positioned[i].yOffset += v1.yPlacement ?? 0;
                    positioned[i].xAdvance += v1.xAdvance ?? 0;
                    positioned[i].yAdvance += v1.yAdvance ?? 0;
                    positioned[i + 1].xOffset += v2.xPlacement ?? 0;
                    positioned[i + 1].yOffset += v2.yPlacement ?? 0;
                    positioned[i + 1].xAdvance += v2.xAdvance ?? 0;
                    positioned[i + 1].yAdvance += v2.yAdvance ?? 0;
                }
                continue;
            }
            if (st instanceof MarkBasePosFormat1 ||
                st instanceof MarkLigPosFormat1 ||
                st instanceof MarkMarkPosFormat1 ||
                st instanceof CursivePosFormat1) {
                continue;
            }
            const constructorName = st?.constructor?.name ?? "unknown";
            this.emitDiagnostic("UNSUPPORTED_GPOS_SUBTABLE", "info", "layout", `Encountered GPOS subtable not currently handled: ${constructorName}.`, { constructorName }, `UNSUPPORTED_GPOS_SUBTABLE:${constructorName}`);
        }
        const markSubtables = subtables.filter((st) => st instanceof MarkBasePosFormat1 ||
            st instanceof MarkLigPosFormat1 ||
            st instanceof MarkMarkPosFormat1 ||
            st instanceof CursivePosFormat1);
        const anchorsCache = new Map();
        const getAnchors = (gid) => {
            if (anchorsCache.has(gid))
                return anchorsCache.get(gid);
            const anchors = this.getGposAttachmentAnchors(gid, markSubtables);
            anchorsCache.set(gid, anchors);
            return anchors;
        };
        const getBaseAnchor = (anchors, classIndex) => {
            const candidates = anchors.filter(a => (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex);
            if (candidates.length === 0)
                return null;
            const ligatureCandidates = candidates.filter(a => a.type === 'ligature');
            if (ligatureCandidates.length > 0) {
                return ligatureCandidates.reduce((best, current) => (current.componentIndex ?? -1) > (best.componentIndex ?? -1) ? current : best);
            }
            return candidates[0];
        };
        for (let i = 0; i < glyphIndices.length; i++) {
            if (!positioned[i])
                continue;
            const anchors = getAnchors(glyphIndices[i]);
            const markAnchor = anchors.find(a => a.type === 'mark');
            if (!markAnchor)
                continue;
            let attached = false;
            let prev = i - 1;
            while (prev >= 0) {
                const prevGid = glyphIndices[prev];
                if (!this.isMarkGlyphForLayout(prevGid)) {
                    prev--;
                    continue;
                }
                const prevAnchors = getAnchors(prevGid);
                const mark2 = prevAnchors.find(a => a.type === 'mark2' && a.classIndex === markAnchor.classIndex);
                if (mark2) {
                    positioned[i].xOffset += (positioned[prev]?.xOffset ?? 0) + (mark2.x - markAnchor.x);
                    positioned[i].yOffset += (positioned[prev]?.yOffset ?? 0) + (mark2.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    attached = true;
                    break;
                }
                prev--;
            }
            if (attached)
                continue;
            let baseIndex = i - 1;
            while (baseIndex >= 0) {
                const baseGid = glyphIndices[baseIndex];
                if (this.isMarkGlyphForLayout(baseGid)) {
                    baseIndex--;
                    continue;
                }
                const baseAnchors = getAnchors(baseGid);
                const baseAnchor = getBaseAnchor(baseAnchors, markAnchor.classIndex);
                if (baseAnchor) {
                    positioned[i].xOffset += (positioned[baseIndex]?.xOffset ?? 0) + (baseAnchor.x - markAnchor.x);
                    positioned[i].yOffset += (positioned[baseIndex]?.yOffset ?? 0) + (baseAnchor.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    break;
                }
                baseIndex--;
            }
        }
        for (let i = 1; i < glyphIndices.length; i++) {
            if (!positioned[i])
                continue;
            const prevAnchors = getAnchors(glyphIndices[i - 1]);
            const currAnchors = getAnchors(glyphIndices[i]);
            const exitAnchor = prevAnchors.find(a => a.type === 'cursive-exit');
            const entryAnchor = currAnchors.find(a => a.type === 'cursive-entry');
            if (exitAnchor && entryAnchor) {
                positioned[i].xOffset += exitAnchor.x - entryAnchor.x;
                positioned[i].yOffset += exitAnchor.y - entryAnchor.y;
            }
        }
        for (let i = 0; i < glyphIndices.length; i++) {
            if (positioned[i] && this.isMarkGlyphForLayout(glyphIndices[i])) {
                positioned[i].xAdvance = 0;
            }
        }
    }
    applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags);
    }
    applyGposPositioning(glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }
    isMarkGlyphClass(glyphId) {
        return (this.gdef?.getGlyphClass?.(glyphId) ?? 0) === 3;
    }
    getTable(tableType) {
        return this.tables.find(tab => tab?.getType?.() === tableType) || null;
    }
    parseSfntTables(byteData) {
        const tf = new TableFactory();
        this.tables = [];
        this.tableDir = new TableDirectory(byteData);
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null)
                this.tables.push(tab);
        }
    }
    wireCommonTables() {
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.cbdt = this.getTable(Table.CBDT);
        this.cblc = this.getTable(Table.CBLC);
        this.glyf = this.getTable(Table.glyf);
        this.cff = this.getTable(Table.CFF);
        this.head = this.getTable(Table.head);
        this.hhea = this.getTable(Table.hhea);
        this.hmtx = this.getTable(Table.hmtx);
        this.vhea = this.getTable(Table.vhea);
        this.vmtx = this.getTable(Table.vmtx);
        this.loca = this.getTable(Table.loca);
        this.maxp = this.getTable(Table.maxp);
        this.pName = this.getTable(Table.pName);
        this.post = this.getTable(Table.post);
        this.sbix = this.getTable(Table.sbix);
        this.gsub = this.getTable(Table.GSUB);
        this.kern = this.getTable(Table.kern);
        this.colr = this.getTable(Table.COLR);
        this.cpal = this.getTable(Table.CPAL);
        this.gpos = this.getTable(Table.GPOS);
        this.gdef = this.getTable(Table.GDEF);
        this.svg = this.getTable(Table.SVG);
        this.ebdt = this.getTable(Table.EBDT);
        this.eblc = this.getTable(Table.EBLC);
        this.ebsc = this.getTable(Table.EBSC);
        this.avar = this.getTable(Table.avar);
        this.fvar = this.getTable(Table.fvar);
        this.gvar = this.getTable(Table.gvar);
        this.hvar = this.getTable(Table.HVAR);
        this.vvar = this.getTable(Table.VVAR);
        this.mvar = this.getTable(Table.MVAR);
        this.stat = this.getTable(Table.STAT);
        this.cvt = this.getTable(Table.cvt);
        this.fpgm = this.getTable(Table.fpgm);
        this.prep = this.getTable(Table.prep);
        const maybeGsubWithGdef = this.gsub;
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef?.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        if (this.fvar && this.fvar.axes.length > 0) {
            const defaults = {};
            for (const axis of this.fvar.axes)
                defaults[axis.name] = axis.defaultValue;
            this.setVariationByAxes(defaults);
        }
        if (this.hmtx && this.maxp) {
            this.hmtx.run(this.hhea?.numberOfHMetrics ?? 0, this.maxp.numGlyphs - (this.hhea?.numberOfHMetrics ?? 0));
        }
        if (this.vmtx && this.maxp) {
            this.vmtx.run(this.vhea?.numberOfVMetrics ?? 0, this.maxp.numGlyphs - (this.vhea?.numberOfVMetrics ?? 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    }
    getGlyphIndexByChar(char) {
        if (!char || char.length === 0) {
            this.emitDiagnostic("INVALID_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar expects a character.");
            return null;
        }
        if (Array.from(char).length > 1) {
            this.emitDiagnostic("MULTI_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar received multiple characters; using the first code point.", undefined, "MULTI_CHAR_INPUT");
        }
        const codePoint = char.codePointAt(0);
        if (codePoint == null) {
            this.emitDiagnostic("CODE_POINT_RESOLVE_FAILED", "warning", "parse", "Failed to resolve code point for character.");
            return null;
        }
        if (this.isNonRenderingFormatCodePoint(codePoint))
            return null;
        const cmap = this.getCmapTableForLookup();
        if (!cmap) {
            this.emitDiagnostic("MISSING_TABLE_CMAP", "warning", "parse", "No cmap table available.", undefined, "MISSING_TABLE_CMAP");
            return null;
        }
        let cmapFormats = [];
        try {
            cmapFormats = this.getOrderedCmapFormatsFor(codePoint);
        }
        catch {
            this.emitDiagnostic("CMAP_FORMAT_RESOLVE_FAILED", "warning", "parse", "Failed while resolving preferred cmap format; using fallback format order.", { codePoint }, "CMAP_FORMAT_RESOLVE_FAILED");
            const fallbackFormats = Array.isArray(cmap.formats)
                ? cmap.formats.filter((fmt) => fmt != null)
                : [];
            const best = this.pickBestFormat(fallbackFormats);
            cmapFormats = best ? [best] : [];
        }
        if (cmapFormats.length === 0) {
            this.emitDiagnostic("MISSING_CMAP_FORMAT", "warning", "parse", "No cmap format available for code point.", { codePoint });
            return null;
        }
        let sawSupportedFormat = false;
        let sawLookupFailure = false;
        for (const cmapFormat of cmapFormats) {
            let glyphIndex = null;
            try {
                if (typeof cmapFormat.getGlyphIndex === "function") {
                    sawSupportedFormat = true;
                    glyphIndex = cmapFormat.getGlyphIndex(codePoint);
                }
                else if (typeof cmapFormat.mapCharCode === "function") {
                    sawSupportedFormat = true;
                    glyphIndex = cmapFormat.mapCharCode(codePoint);
                }
                else {
                    continue;
                }
            }
            catch {
                sawLookupFailure = true;
                continue;
            }
            if (typeof glyphIndex === "number" && Number.isFinite(glyphIndex) && glyphIndex !== 0) {
                return glyphIndex;
            }
        }
        if (!sawSupportedFormat) {
            this.emitDiagnostic("UNSUPPORTED_CMAP_FORMAT", "warning", "parse", "Selected cmap format does not expose getGlyphIndex/mapCharCode.", { codePoint }, "UNSUPPORTED_CMAP_FORMAT");
        }
        else if (sawLookupFailure) {
            this.emitDiagnostic("CMAP_LOOKUP_FAILED", "warning", "parse", "cmap glyph lookup failed for code point.", { codePoint });
        }
        return null;
    }
    getGlyphByChar(char) {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null)
            return null;
        return this.getGlyphByIndexForLayout(idx);
    }
    getGlyphIndicesForString(text) {
        const glyphs = [];
        for (const ch of Array.from(text)) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null)
                glyphs.push(idx);
        }
        return glyphs;
    }
    getGlyphIndicesForStringWithGsub(text, featureTags = ["liga"], scriptTags = ["DFLT", "latn"]) {
        const glyphs = this.getGlyphIndicesForString(text);
        const gsub = this.getGsubTableForLayout();
        if (!gsub || glyphs.length === 0) {
            if (!gsub && glyphs.length > 0) {
                this.emitDiagnostic("MISSING_TABLE_GSUB", "info", "layout", "GSUB table not present; using direct glyph mapping.", undefined, "MISSING_TABLE_GSUB");
            }
            return glyphs;
        }
        return gsub.applyFeatures(glyphs, featureTags, scriptTags);
    }
    getKerningValueByGlyphs(leftGlyph, rightGlyph) {
        const kernTable = this.getKernTableForLayout();
        if (!kernTable)
            return 0;
        if (typeof kernTable.getKerningValue === "function") {
            try {
                const value = kernTable.getKerningValue(leftGlyph, rightGlyph);
                return typeof value === 'number' && Number.isFinite(value) ? value : 0;
            }
            catch {
                return 0;
            }
        }
        return 0;
    }
    getGposKerningValueByGlyphs(leftGlyph, rightGlyph) {
        const gpos = this.getGposTableForLayout();
        if (!gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        const lookups = gpos.lookupList?.getLookups?.() ?? [];
        let value = 0;
        for (const lookup of lookups) {
            if (!lookup || lookup.getType() !== 2)
                continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (typeof st?.getKerning === 'function') {
                    try {
                        const kern = st.getKerning(leftGlyph, rightGlyph);
                        value += Number.isFinite(kern) ? kern : 0;
                    }
                    catch {
                        // Ignore malformed pair subtables and continue.
                    }
                }
            }
        }
        return Number.isFinite(value) ? value : 0;
    }
    getKerningValue(leftChar, rightChar) {
        const left = this.getGlyphIndexByChar(leftChar);
        const right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null)
            return 0;
        const kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0)
            return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    }
    layoutString(text, options = {}) {
        const gsubFeatures = options.gsubFeatures ?? ["liga"];
        const scriptTags = options.scriptTags ?? ["DFLT", "latn"];
        const kerningEnabled = options.kerning ?? true;
        const gposFeatures = options.gposFeatures ?? (kerningEnabled ? ["kern", "mark", "mkmk", "curs"] : ["mark", "mkmk", "curs"]);
        const glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
        const positioned = [];
        for (let i = 0; i < glyphIndices.length; i++) {
            const glyphIndex = glyphIndices[i];
            const glyph = this.getGlyphByIndexForLayout(glyphIndex);
            let kern = 0;
            if (kerningEnabled && i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0 && !options.gpos) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }
            positioned.push({
                glyphIndex,
                xAdvance: this.isMarkGlyphForLayout(glyphIndex) ? 0 : (glyph?.advanceWidth ?? 0) + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0
            });
        }
        if (options.gpos) {
            if (!this.getGposTableForLayout()) {
                this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "Requested GPOS positioning, but GPOS table is unavailable.", undefined, "MISSING_TABLE_GPOS");
            }
            this.applyGposPositioningForLayout(glyphIndices, positioned, gposFeatures, scriptTags);
        }
        return positioned;
    }
    getTableByType(tableType) {
        return this.getTable(tableType);
    }
    getNumGlyphs() {
        return this.maxp?.numGlyphs ?? 0;
    }
    getAscent() {
        return this.hhea?.ascender ?? 0;
    }
    getDescent() {
        return this.hhea?.descender ?? 0;
    }
    getUnitsPerEm() {
        return this.head?.unitsPerEm ?? 1000;
    }
    getMarkAnchorsForGlyph(glyphId, subtables) {
        return this.getGposAttachmentAnchors(glyphId, subtables);
    }
    async getSvgDocumentForGlyphAsync(glyphId) {
        if (!this.svg)
            return { svgText: null, isCompressed: false };
        return this.svg.getSvgDocumentForGlyphAsync(glyphId);
    }
    getNameInfo() {
        return {
            family: this.getNameRecordForInfo(1),
            subfamily: this.getNameRecordForInfo(2),
            fullName: this.getNameRecordForInfo(4),
            postScriptName: this.getNameRecordForInfo(6),
            version: this.getNameRecordForInfo(5),
            manufacturer: this.getNameRecordForInfo(8),
            designer: this.getNameRecordForInfo(9),
            description: this.getNameRecordForInfo(10),
            typoFamily: this.getNameRecordForInfo(16),
            typoSubfamily: this.getNameRecordForInfo(17)
        };
    }
    getOs2Info() {
        const os2 = this.getOs2TableForInfo();
        if (!os2)
            return null;
        const vendorRaw = os2.achVendorID >>> 0;
        const vendorId = String.fromCharCode((vendorRaw >>> 24) & 0xff, (vendorRaw >>> 16) & 0xff, (vendorRaw >>> 8) & 0xff, vendorRaw & 0xff).replace(/\0/g, '');
        return {
            weightClass: os2.usWeightClass,
            widthClass: os2.usWidthClass,
            typoAscender: os2.sTypoAscender,
            typoDescender: os2.sTypoDescender,
            typoLineGap: os2.sTypoLineGap,
            winAscent: os2.usWinAscent,
            winDescent: os2.usWinDescent,
            unicodeRanges: [os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4],
            codePageRanges: [os2.ulCodePageRange1, os2.ulCodePageRange2],
            vendorId,
            fsSelection: os2.fsSelection
        };
    }
    getPostInfo() {
        const post = this.getPostTableForInfo();
        if (!post)
            return null;
        return {
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch
        };
    }
    layoutStringAuto(text, options = {}) {
        const detection = detectScriptTags(text);
        return this.layoutString(text, {
            gsubFeatures: detection.features,
            scriptTags: detection.scripts,
            gpos: options.gpos ?? true,
            gposFeatures: options.gposFeatures,
            kerning: options.kerning
        });
    }
    getVariationAxes() {
        return this.getFvarTableForShared?.()?.axes ?? [];
    }
    setVariationCoords(coords) {
        const copy = coords.slice();
        if (typeof this.setVariationCoordsInternal === 'function') {
            this.setVariationCoordsInternal(copy);
        }
        else {
            this.variationCoords = copy;
        }
        if (typeof this.onVariationCoordsUpdated === 'function') {
            this.onVariationCoordsUpdated(copy);
        }
    }
    setVariationByAxes(values) {
        const fvar = this.getFvarTableForShared?.() ?? this.fvar ?? null;
        if (!fvar)
            return;
        const avar = this.getAvarTableForShared?.() ?? this.avar ?? null;
        const coords = [];
        let axisIndex = 0;
        for (const axis of fvar.axes ?? []) {
            const tag = axis.name;
            const value = values[tag] ?? axis.defaultValue;
            let norm = 0;
            if (value !== axis.defaultValue) {
                if (value > axis.defaultValue) {
                    const span = axis.maxValue - axis.defaultValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
                else {
                    const span = axis.defaultValue - axis.minValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
            }
            if (avar && typeof avar.mapCoord === 'function') {
                norm = avar.mapCoord(axisIndex, norm);
            }
            coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
            axisIndex++;
        }
        this.setVariationCoords(coords);
    }
    getVariationInfo() {
        const stat = this.getStatTableForShared?.() ?? this.stat ?? null;
        return {
            axes: this.getVariationAxes(),
            hasAvar: !!this.avar,
            hasGvar: !!this.gvar,
            hasHvar: !!this.hvar,
            hasVvar: !!this.vvar,
            hasMvar: !!this.mvar,
            hasStat: !!stat,
            stat: stat ? {
                designAxes: Array.isArray(stat.designAxes) ? stat.designAxes : [],
                axisValues: Array.isArray(stat.axisValues) ? stat.axisValues : [],
                elidedFallbackNameId: Number.isFinite(stat.elidedFallbackNameId) ? stat.elidedFallbackNameId : null
            } : null
        };
    }
    getGlyphPointsByChar(char, options = {}) {
        const glyph = this.getGlyphByChar(char);
        if (!glyph)
            return [];
        const sampleStep = Math.max(1, Math.floor(options.sampleStep ?? 1));
        const points = [];
        for (let i = 0; i < glyph.getPointCount(); i += sampleStep) {
            const p = glyph.getPoint(i);
            if (!p)
                continue;
            points.push({
                x: p.x,
                y: p.y,
                onCurve: p.onCurve,
                endOfContour: p.endOfContour
            });
        }
        return points;
    }
    measureText(text, options = {}) {
        const layout = this.layoutString(text, options);
        const letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
        let advanceWidth = 0;
        for (let i = 0; i < layout.length; i++) {
            const xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
            advanceWidth += xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1)
                advanceWidth += letterSpacing;
        }
        return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
    }
    layoutToPoints(text, options = {}) {
        const layout = this.layoutString(text, options);
        const sampleBase = Number.isFinite(options.sampleStep) ? options.sampleStep : 1;
        const sampleStep = Math.max(1, Math.floor(sampleBase));
        const unitsPerEm = this.getUnitsPerEmForShared();
        const safeUnitsPerEm = Number.isFinite(unitsPerEm) && unitsPerEm > 0 ? unitsPerEm : 1000;
        const fontSize = Number.isFinite(options.fontSize) && options.fontSize > 0
            ? options.fontSize
            : safeUnitsPerEm;
        const scale = fontSize / safeUnitsPerEm;
        const originX = Number.isFinite(options.x) ? options.x : 0;
        const originY = Number.isFinite(options.y) ? options.y : 0;
        const letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
        const points = [];
        let penX = 0;
        for (let i = 0; i < layout.length; i++) {
            const item = layout[i];
            const glyph = this.getGlyphByIndexForLayout(item.glyphIndex);
            if (glyph) {
                for (let pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                    const p = glyph.getPoint(pIndex);
                    if (!p)
                        continue;
                    points.push({
                        x: originX + (penX + (Number.isFinite(item.xOffset) ? item.xOffset : 0) + p.x) * scale,
                        y: originY - ((Number.isFinite(item.yOffset) ? item.yOffset : 0) + p.y) * scale,
                        onCurve: p.onCurve,
                        endOfContour: p.endOfContour,
                        glyphIndex: item.glyphIndex,
                        pointIndex: pIndex
                    });
                }
            }
            penX += Number.isFinite(item.xAdvance) ? item.xAdvance : 0;
            if (letterSpacing !== 0 && i < layout.length - 1)
                penX += letterSpacing;
        }
        return { points, advanceWidth: Number.isFinite(penX) ? penX : 0, scale: Number.isFinite(scale) ? scale : 1 };
    }
    getColorLayersForGlyph(glyphId, paletteIndex = 0) {
        const colr = this.getColrTableForShared();
        if (!colr)
            return [];
        const layers = colr.getLayersForGlyph(glyphId);
        if (layers.length === 0)
            return [];
        const palette = this.getCpalTableForShared()?.getPalette(paletteIndex) ?? [];
        return layers.map((layer) => {
            if (layer.paletteIndex === 0xffff) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            const color = palette[layer.paletteIndex];
            if (!color) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            const rgba = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha / 255})`;
            return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
        });
    }
    getColorLayersForChar(char, paletteIndex = 0) {
        const glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    }
    getColrV1LayersForGlyph(glyphId, paletteIndex = 0) {
        const colr = this.getColrTableForShared();
        if (!colr || colr.version === 0)
            return [];
        const paint = colr.getPaintForGlyph(glyphId);
        if (!paint)
            return [];
        return this.flattenColrV1Paint(paint, paletteIndex);
    }
    flattenColrV1Paint(paint, paletteIndex) {
        if (!paint)
            return [];
        if (paint.format === 1 && Array.isArray(paint.layers)) {
            return paint.layers.flatMap((p) => this.flattenColrV1Paint(p, paletteIndex));
        }
        if (paint.format === 10) {
            const child = paint.paint;
            if (child && child.format === 2) {
                const color = this.getCpalTableForShared()?.getPalette(paletteIndex)?.[child.paletteIndex];
                const rgba = color ? `rgba(${color.red}, ${color.green}, ${color.blue}, ${(color.alpha / 255) * (child.alpha ?? 1)})` : null;
                return [{ glyphId: paint.glyphID, color: rgba, paletteIndex: child.paletteIndex }];
            }
            return this.flattenColrV1Paint(child, paletteIndex).map(layer => ({ ...layer, glyphId: paint.glyphID }));
        }
        if (paint.format === 11) {
            return this.getColrV1LayersForGlyph(paint.glyphID, paletteIndex);
        }
        return [];
    }
    getNameRecord(nameId) {
        return this.getNameTableForShared()?.getRecord(nameId) ?? "";
    }
    getAllNameRecords() {
        const name = this.getNameTableForShared();
        if (!name)
            return [];
        return (name.records ?? []).map((r) => ({ nameId: r.nameId, record: r.record }));
    }
    getAllNameRecordsDetailed() {
        const name = this.getNameTableForShared();
        if (!name)
            return [];
        return (name.records ?? []).map((r) => ({
            nameId: r.nameId,
            record: r.record,
            platformId: r.platformId,
            encodingId: r.encodingId,
            languageId: r.languageId
        }));
    }
    getFontNames() {
        return {
            family: this.getPreferredNameRecord(1),
            subfamily: this.getPreferredNameRecord(2),
            uniqueSubfamily: this.getPreferredNameRecord(3),
            fullName: this.getPreferredNameRecord(4),
            version: this.getPreferredNameRecord(5),
            postScriptName: this.getPreferredNameRecord(6),
            manufacturer: this.getPreferredNameRecord(8),
            designer: this.getPreferredNameRecord(9),
            description: this.getPreferredNameRecord(10),
            vendorUrl: this.getPreferredNameRecord(11),
            designerUrl: this.getPreferredNameRecord(12),
            license: this.getPreferredNameRecord(13),
            licenseUrl: this.getPreferredNameRecord(14),
            typographicFamily: this.getPreferredNameRecord(16),
            typographicSubfamily: this.getPreferredNameRecord(17)
        };
    }
    getOs2Metrics() {
        const os2 = this.getOs2TableForShared();
        if (!os2)
            return null;
        return {
            version: os2.version,
            weightClass: os2.usWeightClass,
            widthClass: os2.usWidthClass,
            fsType: os2.fsType,
            fsSelection: os2.fsSelection,
            typoAscender: os2.sTypoAscender,
            typoDescender: os2.sTypoDescender,
            typoLineGap: os2.sTypoLineGap,
            winAscent: os2.usWinAscent,
            winDescent: os2.usWinDescent,
            firstCharIndex: os2.usFirstCharIndex,
            lastCharIndex: os2.usLastCharIndex,
            vendorId: this.decodeOs2VendorId(os2.achVendorID),
            unicodeRanges: [os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4],
            codePageRanges: [os2.ulCodePageRange1, os2.ulCodePageRange2],
            xHeight: os2.version >= 2 ? os2.sxHeight : null,
            capHeight: os2.version >= 2 ? os2.sCapHeight : null,
            defaultChar: os2.version >= 2 ? os2.usDefaultChar : null,
            breakChar: os2.version >= 2 ? os2.usBreakChar : null,
            maxContext: os2.version >= 2 ? os2.usMaxContext : null,
            lowerOpticalPointSize: os2.version >= 5 ? os2.usLowerOpticalPointSize : null,
            upperOpticalPointSize: os2.version >= 5 ? os2.usUpperOpticalPointSize : null,
            panose: os2.panose
                ? {
                    familyType: os2.panose.bFamilyType,
                    serifStyle: os2.panose.bSerifStyle,
                    weight: os2.panose.bWeight,
                    proportion: os2.panose.bProportion,
                    contrast: os2.panose.bContrast,
                    strokeVariation: os2.panose.bStrokeVariation,
                    armStyle: os2.panose.bArmStyle,
                    letterform: os2.panose.bLetterform,
                    midline: os2.panose.bMidline,
                    xHeight: os2.panose.bXHeight
                }
                : null
        };
    }
    getPostMetrics() {
        const post = this.getPostTableForShared();
        if (!post)
            return null;
        return {
            version: post.version / 65536,
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch !== 0,
            rawIsFixedPitch: post.isFixedPitch
        };
    }
    getVerticalMetrics() {
        if (!this.vhea)
            return null;
        return {
            ascender: this.vhea.ascender ?? 0,
            descender: this.vhea.descender ?? 0,
            lineGap: this.vhea.lineGap ?? 0,
            advanceHeightMax: this.vhea.advanceHeightMax ?? 0,
            minTopSideBearing: this.vhea.minTopSideBearing ?? 0,
            minBottomSideBearing: this.vhea.minBottomSideBearing ?? 0,
            yMaxExtent: this.vhea.yMaxExtent ?? 0,
            caretSlopeRise: this.vhea.caretSlopeRise ?? 0,
            caretSlopeRun: this.vhea.caretSlopeRun ?? 0,
            caretOffset: this.vhea.caretOffset ?? 0,
            metricDataFormat: this.vhea.metricDataFormat ?? 0,
            numberOfVMetrics: this.vhea.numberOfVMetrics ?? 0,
            hasVerticalMetricsTable: !!this.vmtx
        };
    }
    getWeightClass() {
        return this.getOs2TableForShared()?.usWeightClass ?? 0;
    }
    getWidthClass() {
        return this.getOs2TableForShared()?.usWidthClass ?? 0;
    }
    getFsTypeFlags() {
        const fsType = this.getOs2TableForShared()?.fsType ?? 0;
        if (fsType === 0)
            return ['installable-embedding'];
        const flags = [];
        if (fsType & 0x0002)
            flags.push('restricted-license-embedding');
        if (fsType & 0x0004)
            flags.push('preview-print-embedding');
        if (fsType & 0x0008)
            flags.push('editable-embedding');
        if (fsType & 0x0100)
            flags.push('no-subsetting');
        if (fsType & 0x0200)
            flags.push('bitmap-embedding-only');
        return flags;
    }
    getFsSelectionFlags() {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        const flags = [];
        if (fsSelection & 0x0001)
            flags.push('italic');
        if (fsSelection & 0x0002)
            flags.push('underscore');
        if (fsSelection & 0x0004)
            flags.push('negative');
        if (fsSelection & 0x0008)
            flags.push('outlined');
        if (fsSelection & 0x0010)
            flags.push('strikeout');
        if (fsSelection & 0x0020)
            flags.push('bold');
        if (fsSelection & 0x0040)
            flags.push('regular');
        if (fsSelection & 0x0080)
            flags.push('use-typo-metrics');
        if (fsSelection & 0x0100)
            flags.push('wws');
        if (fsSelection & 0x0200)
            flags.push('oblique');
        return flags;
    }
    isItalic() {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        if (fsSelection & 0x0001)
            return true;
        if (fsSelection & 0x0200)
            return true;
        if ((this.getPostTableForShared()?.italicAngle ?? 0) !== 0)
            return true;
        const subfamily = this.getPreferredNameRecord(2).toLowerCase();
        return subfamily.includes('italic') || subfamily.includes('oblique');
    }
    isBold() {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        if (fsSelection & 0x0020)
            return true;
        if ((this.getOs2TableForShared()?.usWeightClass ?? 0) >= 700)
            return true;
        return this.getPreferredNameRecord(2).toLowerCase().includes('bold');
    }
    isMonospace() {
        return (this.getPostTableForShared()?.isFixedPitch ?? 0) !== 0;
    }
    getMetadata() {
        return {
            names: this.getFontNames(),
            nameRecords: this.getAllNameRecordsDetailed(),
            os2: this.getOs2Metrics(),
            post: this.getPostMetrics(),
            vertical: this.getVerticalMetrics(),
            bitmapColor: this.getBitmapColorInfo(),
            style: {
                isBold: this.isBold(),
                isItalic: this.isItalic(),
                isMonospace: this.isMonospace(),
                weightClass: this.getWeightClass(),
                widthClass: this.getWidthClass(),
                fsTypeFlags: this.getFsTypeFlags(),
                fsSelectionFlags: this.getFsSelectionFlags()
            }
        };
    }
    getBitmapColorInfo() {
        const tables = [];
        const tableLengths = {};
        const collect = (tag, table) => {
            if (!table)
                return;
            tables.push(tag);
            const length = typeof table.getLength === 'function' ? table.getLength() : null;
            if (Number.isFinite(length))
                tableLengths[tag] = length;
        };
        collect('CBDT', this.cbdt);
        collect('CBLC', this.cblc);
        collect('sbix', this.sbix);
        collect('EBDT', this.ebdt);
        collect('EBLC', this.eblc);
        collect('EBSC', this.ebsc);
        let format = null;
        if (this.cbdt && this.cblc)
            format = 'cbdt-cblc';
        else if (this.sbix)
            format = 'sbix';
        else if (this.ebdt && this.eblc)
            format = 'ebdt-eblc';
        return {
            hasBitmapData: tables.length > 0,
            format,
            tables,
            tableLengths
        };
    }
    getBitmapStrikeForGlyph(glyphId, preferredPpem) {
        const cblcStrike = this.getCbdtBitmapStrikeForGlyph(glyphId, preferredPpem);
        if (cblcStrike)
            return cblcStrike;
        return this.getSbixBitmapStrikeForGlyph(glyphId, preferredPpem);
    }
    getCbdtBitmapStrikeForGlyph(glyphId, preferredPpem) {
        const cblc = this.cblc ?? this.eblc;
        const cbdt = this.cbdt ?? this.ebdt;
        if (!cblc || !cbdt || typeof cblc.getBytes !== 'function' || typeof cbdt.getBytes !== 'function') {
            return null;
        }
        const cblcBytes = cblc.getBytes();
        const cbdtBytes = cbdt.getBytes();
        if (!(cblcBytes instanceof Uint8Array) || !(cbdtBytes instanceof Uint8Array) || cblcBytes.length < 8 || cbdtBytes.length < 4) {
            return null;
        }
        const cblcView = new DataView(cblcBytes.buffer, cblcBytes.byteOffset, cblcBytes.byteLength);
        const cbdtView = new DataView(cbdtBytes.buffer, cbdtBytes.byteOffset, cbdtBytes.byteLength);
        const numSizes = cblcView.getUint32(4, false);
        const strikes = [];
        for (let i = 0; i < numSizes; i++) {
            const strikeOffset = 8 + (i * 48);
            if (strikeOffset + 48 > cblcBytes.length)
                break;
            strikes.push({
                bitmapSizeTableOffset: strikeOffset,
                indexSubTableArrayOffset: cblcView.getUint32(strikeOffset, false),
                numberOfIndexSubTables: cblcView.getUint32(strikeOffset + 8, false),
                ppemX: cblcView.getUint8(strikeOffset + 44),
                ppemY: cblcView.getUint8(strikeOffset + 45),
                bitDepth: cblcView.getUint8(strikeOffset + 46)
            });
        }
        const orderedStrikes = strikes.slice().sort((a, b) => {
            if (!Number.isFinite(preferredPpem))
                return 0;
            const target = preferredPpem;
            return Math.abs(a.ppemY - target) - Math.abs(b.ppemY - target);
        });
        for (const strike of orderedStrikes) {
            const arrayBase = strike.indexSubTableArrayOffset;
            for (let i = 0; i < strike.numberOfIndexSubTables; i++) {
                const recOffset = arrayBase + (i * 8);
                if (recOffset + 8 > cblcBytes.length)
                    break;
                const firstGlyphIndex = cblcView.getUint16(recOffset, false);
                const lastGlyphIndex = cblcView.getUint16(recOffset + 2, false);
                const additionalOffset = cblcView.getUint32(recOffset + 4, false);
                if (glyphId < firstGlyphIndex || glyphId > lastGlyphIndex)
                    continue;
                const subtableOffset = arrayBase + additionalOffset;
                if (subtableOffset + 8 > cblcBytes.length)
                    return null;
                const indexFormat = cblcView.getUint16(subtableOffset, false);
                const imageFormat = cblcView.getUint16(subtableOffset + 2, false);
                const imageDataOffset = cblcView.getUint32(subtableOffset + 4, false);
                if (indexFormat !== 1)
                    return null;
                const glyphIndex = glyphId - firstGlyphIndex;
                const offsetArrayOffset = subtableOffset + 8;
                const startOffsetPos = offsetArrayOffset + (glyphIndex * 4);
                const endOffsetPos = startOffsetPos + 4;
                if (endOffsetPos + 4 > cblcBytes.length)
                    return null;
                const startOffset = cblcView.getUint32(startOffsetPos, false);
                const endOffset = cblcView.getUint32(endOffsetPos, false);
                if (endOffset < startOffset)
                    return null;
                const bitmapOffset = imageDataOffset + startOffset;
                const bitmapLength = endOffset - startOffset;
                if (bitmapOffset < 0 || bitmapOffset + bitmapLength > cbdtBytes.length || bitmapOffset + 4 > cbdtBytes.length)
                    return null;
                let cursor = bitmapOffset;
                let metrics = null;
                if (imageFormat === 17) {
                    if (cursor + 9 > cbdtBytes.length)
                        return null;
                    metrics = {
                        height: cbdtView.getUint8(cursor),
                        width: cbdtView.getUint8(cursor + 1),
                        bearingX: cbdtView.getInt8(cursor + 2),
                        bearingY: cbdtView.getInt8(cursor + 3),
                        advance: cbdtView.getUint8(cursor + 4)
                    };
                    cursor += 5;
                }
                else if (imageFormat === 18) {
                    if (cursor + 12 > cbdtBytes.length)
                        return null;
                    metrics = {
                        height: cbdtView.getUint8(cursor),
                        width: cbdtView.getUint8(cursor + 1),
                        bearingX: cbdtView.getInt8(cursor + 2),
                        bearingY: cbdtView.getInt8(cursor + 3),
                        advance: cbdtView.getUint8(cursor + 7)
                    };
                    cursor += 8;
                }
                if (imageFormat !== 17 && imageFormat !== 18 && imageFormat !== 19)
                    return null;
                const dataLength = cbdtView.getUint32(cursor, false);
                cursor += 4;
                if (dataLength < 0 || cursor + dataLength > cbdtBytes.length)
                    return null;
                const data = cbdtBytes.slice(cursor, cursor + dataLength);
                const mimeType = this.getBitmapMimeType(data);
                return {
                    glyphId,
                    ppemX: strike.ppemX,
                    ppemY: strike.ppemY,
                    bitDepth: strike.bitDepth,
                    imageFormat,
                    graphicType: null,
                    metrics,
                    mimeType,
                    data
                };
            }
        }
        return null;
    }
    getSbixBitmapStrikeForGlyph(glyphId, preferredPpem) {
        const sbix = this.sbix;
        if (!sbix || typeof sbix.getBytes !== 'function')
            return null;
        const sbixBytes = sbix.getBytes();
        if (!(sbixBytes instanceof Uint8Array) || sbixBytes.length < 8)
            return null;
        const numGlyphs = this.getNumGlyphs();
        if (!Number.isFinite(numGlyphs) || numGlyphs <= 0 || glyphId < 0 || glyphId >= numGlyphs)
            return null;
        const view = new DataView(sbixBytes.buffer, sbixBytes.byteOffset, sbixBytes.byteLength);
        const numStrikes = view.getUint32(4, false);
        if (numStrikes <= 0 || sbixBytes.length < 8 + (numStrikes * 4))
            return null;
        const strikeOffsets = [];
        for (let i = 0; i < numStrikes; i++) {
            strikeOffsets.push(view.getUint32(8 + (i * 4), false));
        }
        const orderedStrikeOffsets = strikeOffsets.slice().sort((aOffset, bOffset) => {
            if (!Number.isFinite(preferredPpem))
                return 0;
            if (aOffset + 4 > sbixBytes.length || bOffset + 4 > sbixBytes.length)
                return 0;
            const target = preferredPpem;
            const aPpem = view.getUint16(aOffset, false);
            const bPpem = view.getUint16(bOffset, false);
            return Math.abs(aPpem - target) - Math.abs(bPpem - target);
        });
        for (const strikeOffset of orderedStrikeOffsets) {
            const glyphOffsetArray = strikeOffset + 4;
            const offsetArrayLength = (numGlyphs + 1) * 4;
            if (glyphOffsetArray + offsetArrayLength > sbixBytes.length)
                continue;
            const ppem = view.getUint16(strikeOffset, false);
            const resolution = view.getUint16(strikeOffset + 2, false);
            const glyphDataStart = view.getUint32(glyphOffsetArray + (glyphId * 4), false);
            const glyphDataEnd = view.getUint32(glyphOffsetArray + ((glyphId + 1) * 4), false);
            if (glyphDataEnd <= glyphDataStart)
                continue;
            const glyphOffset = strikeOffset + glyphDataStart;
            const glyphEnd = strikeOffset + glyphDataEnd;
            if (glyphOffset + 8 > sbixBytes.length || glyphEnd > sbixBytes.length || glyphEnd <= glyphOffset + 8)
                continue;
            const bearingX = view.getInt16(glyphOffset, false);
            const bearingY = view.getInt16(glyphOffset + 2, false);
            const graphicTypeBytes = sbixBytes.slice(glyphOffset + 4, glyphOffset + 8);
            const graphicType = String.fromCharCode(...graphicTypeBytes);
            if (graphicType === 'dupe') {
                if (glyphOffset + 10 > glyphEnd)
                    return null;
                const targetGlyphId = view.getUint16(glyphOffset + 8, false);
                if (targetGlyphId === glyphId)
                    return null;
                return this.getSbixBitmapStrikeForGlyph(targetGlyphId, preferredPpem);
            }
            const data = sbixBytes.slice(glyphOffset + 8, glyphEnd);
            const mimeType = this.getBitmapMimeType(data, graphicType);
            const dimensions = this.getBitmapImageDimensions(data, mimeType);
            const glyph = this.getGlyph(glyphId);
            return {
                glyphId,
                ppemX: ppem,
                ppemY: ppem,
                bitDepth: 32,
                imageFormat: null,
                graphicType,
                metrics: {
                    height: dimensions?.height ?? 0,
                    width: dimensions?.width ?? 0,
                    bearingX,
                    bearingY,
                    advance: glyph?.advanceWidth ?? 0
                },
                mimeType,
                data
            };
        }
        return null;
    }
    getBitmapStrikeForChar(char, preferredPpem) {
        const glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return null;
        return this.getBitmapStrikeForGlyph(glyphId, preferredPpem);
    }
    getBitmapMimeType(data, graphicType) {
        const normalizedGraphicType = (graphicType ?? '').trim().toLowerCase();
        if (normalizedGraphicType === 'png')
            return 'image/png';
        if (normalizedGraphicType === 'jpg' || normalizedGraphicType === 'jpeg')
            return 'image/jpeg';
        if (normalizedGraphicType === 'tiff')
            return 'image/tiff';
        if (data.length >= 8
            && data[0] === 0x89
            && data[1] === 0x50
            && data[2] === 0x4e
            && data[3] === 0x47
            && data[4] === 0x0d
            && data[5] === 0x0a
            && data[6] === 0x1a
            && data[7] === 0x0a) {
            return 'image/png';
        }
        if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
            return 'image/jpeg';
        }
        return null;
    }
    getBitmapImageDimensions(data, mimeType) {
        if (mimeType === 'image/png' && data.length >= 24) {
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
            return {
                width: view.getUint32(16, false),
                height: view.getUint32(20, false)
            };
        }
        return null;
    }
    getPreferredNameRecord(nameId) {
        const name = this.getNameTableForShared();
        if (!name || (name.records ?? []).length === 0)
            return '';
        const candidates = (name.records ?? []).filter((r) => r.nameId === nameId && !!r.record && r.record.trim().length > 0);
        if (candidates.length === 0)
            return '';
        const score = (rec) => {
            let s = 0;
            if (rec.platformId === Table.platformMicrosoft)
                s += 100;
            else if (rec.platformId === Table.platformAppleUnicode)
                s += 80;
            else if (rec.platformId === Table.platformMacintosh)
                s += 60;
            if (rec.languageId === 0x0409)
                s += 30;
            if (rec.languageId === 0)
                s += 10;
            return s;
        };
        let best = candidates[0];
        let bestScore = score(best);
        for (let i = 1; i < candidates.length; i++) {
            const current = candidates[i];
            const currentScore = score(current);
            if (currentScore > bestScore) {
                best = current;
                bestScore = currentScore;
            }
        }
        return best.record;
    }
    decodeOs2VendorId(vendor) {
        const n = vendor >>> 0;
        const text = String.fromCharCode((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
        return text.replace(/\0/g, '').trim();
    }
}
