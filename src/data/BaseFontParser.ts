import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
import type { IGlyphDescription } from '../table/IGlyphDescription.js';
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
import { ByteArray } from '../utils/ByteArray.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { TrueTypeHintVM, HintingMode, HintingOptions } from '../hint/TrueTypeHintVM.js';

type PositionedGlyph = { glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number };
type MarkAnchorType = 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit';
type MarkAnchor = { type: MarkAnchorType; classIndex: number; x: number; y: number; componentIndex?: number };
type GlyphBuildOptions = {
    maxGlyphs?: number | null;
    glyf?: any | null;
    hmtx?: any | null;
    gvar?: any | null;
    variationCoords?: number[];
    cff?: any | null;
    cff2?: any | null;
    cffIncludePhantoms?: boolean;
    cvt?: any | null;
    fpgm?: any | null;
    prep?: any | null;
};

type CmapFormatLike = {
    format?: number;
    getFormatType?: () => number;
    getGlyphIndex?: (codePoint: number) => number | null;
    mapCharCode?: (codePoint: number) => number | null;
};

type CmapLike = {
    formats: CmapFormatLike[];
    getCmapFormats: (platformId: number, encodingId: number) => CmapFormatLike[];
};

export abstract class BaseFontParser {
    private diagnostics: FontDiagnostic[] = [];
    private diagnosticKeys = new Set<string>();
    protected tableDir: TableDirectory | null = null;
    protected tables: any[] = [];
    protected os2: any | null = null;
    protected cmap: any | null = null;
    protected glyf: any | null = null;
    protected cff: any | null = null;
    protected head: any | null = null;
    protected hhea: any | null = null;
    protected hmtx: any | null = null;
    protected loca: any | null = null;
    protected maxp: any | null = null;
    protected pName: any | null = null;
    protected post: any | null = null;
    protected gsub: any | null = null;
    protected kern: { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null = null;
    protected colr: any | null = null;
    protected cpal: any | null = null;
    protected gpos: any | null = null;
    protected gdef: { getGlyphClass?: (glyphId: number) => number } | null = null;
    protected fvar: any | null = null;
    protected svg: any | null = null;
    protected gvar: any | null = null;
    protected cvt: any | null = null;
    protected fpgm: any | null = null;
    protected prep: any | null = null;
    protected variationCoords: number[] = [];
    protected hintingEnabled = false;
    protected hintingMode: HintingMode = 'none';
    protected hintingPpem = 16;
    protected hintVm = new TrueTypeHintVM();

    protected emitDiagnostic(
        code: string,
        level: 'warning' | 'info',
        phase: 'parse' | 'layout',
        message: string,
        context?: Record<string, unknown>,
        onceKey?: string
    ): void {
        if (onceKey) {
            if (this.diagnosticKeys.has(onceKey)) return;
            this.diagnosticKeys.add(onceKey);
        }
        this.diagnostics.push({ code, level, phase, message, context });
    }

    public getDiagnostics(filter?: DiagnosticFilter): FontDiagnostic[] {
        return this.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
    }

    public clearDiagnostics(): void {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
    }

    protected getCmapTableForLookup(): any | null {
        return this.cmap as any;
    }

    protected getBestCmapFormatFor(codePoint: number): any | null {
        const cmap = this.getCmapTableForLookup() as CmapLike | null;
        if (!cmap) return null;

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
            let formats: CmapFormatLike[] = [];
            try {
                const resolved = cmap.getCmapFormats(pref.platformId, pref.encodingId);
                formats = Array.isArray(resolved) ? resolved : [];
            } catch {
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

    protected pickBestFormat(formats: any[], order: number[] = [4, 12, 10, 8, 6, 2, 0]): any | null {
        if (formats.length === 0) return null;
        const safeFormats = formats.filter((f: any): f is CmapFormatLike => !!f && typeof f === 'object');
        if (safeFormats.length === 0) return null;
        for (const fmt of order) {
            const found = safeFormats.find((f) => (typeof f.getFormatType === 'function' ? f.getFormatType() : f.format) === fmt);
            if (found) return found;
        }
        return safeFormats[0];
    }

    protected isNonRenderingFormatCodePoint(codePoint: number): boolean {
        return codePoint === 0x00AD
            || codePoint === 0x061C
            || codePoint === 0x200B
            || codePoint === 0x200E
            || codePoint === 0x200F
            || codePoint === 0x2060
            || codePoint === 0xFEFF;
    }

    protected getGsubTableForLayout(): any | null {
        return this.gsub;
    }

    protected getKernTableForLayout(): { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null {
        return this.kern;
    }

    protected getGposTableForLayout(): any | null {
        return this.gpos;
    }

    protected getGlyphByIndexForLayout(glyphIndex: number): any | null {
        return this.getGlyph(glyphIndex);
    }

    protected isMarkGlyphForLayout(glyphIndex: number): boolean {
        return this.isMarkGlyphClass(glyphIndex);
    }

    protected applyGposPositioningForLayout(
        glyphIndices: number[],
        positioned: PositionedGlyph[],
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    protected getNameRecordForInfo(nameId: number): string {
        return this.getNameRecord(nameId);
    }

    protected getOs2TableForInfo(): any | null {
        return this.os2;
    }

    protected getPostTableForInfo(): any | null {
        return this.post;
    }

    protected getNameTableForShared(): any | null {
        return this.pName;
    }

    protected getOs2TableForShared(): any | null {
        return this.os2;
    }

    protected getPostTableForShared(): any | null {
        return this.post;
    }

    protected getFvarTableForShared(): any | null {
        return this.fvar;
    }

    protected getColrTableForShared(): any | null {
        return this.colr;
    }

    protected getCpalTableForShared(): any | null {
        return this.cpal;
    }

    protected getUnitsPerEmForShared(): number {
        return this.getUnitsPerEm();
    }

    protected setVariationCoordsInternal(coords: number[]): void {
        this.variationCoords = coords.slice();
    }

    protected onVariationCoordsUpdated(coords: number[]): void {
        if (this.colr && typeof (this.colr as any).setVariationCoords === 'function') {
            (this.colr as any).setVariationCoords(coords);
        }
    }

    public setHintingOptions(options: HintingOptions = {}): void {
        if (typeof options.enabled === 'boolean') {
            this.hintingEnabled = options.enabled;
        }
        if (options.mode === 'none' || options.mode === 'vm-experimental') {
            this.hintingMode = options.mode;
        }
        if (Number.isFinite(options.ppem)) {
            this.hintingPpem = Math.max(1, Math.round(options.ppem as number));
        }
    }

    public getHintingOptions(): { enabled: boolean; mode: HintingMode; ppem: number } {
        return {
            enabled: this.hintingEnabled,
            mode: this.hintingMode,
            ppem: this.hintingPpem
        };
    }

    public abstract getGlyph(i: number): GlyphData | null;

    protected getGlyphShared(i: number, options: GlyphBuildOptions): GlyphData | null {
        const maxGlyphs = options.maxGlyphs ?? null;
        if (i < 0 || (maxGlyphs != null && i >= maxGlyphs)) return null;
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
                const descriptionComponents = description instanceof GlyfCompositeDescript && Array.isArray((description as any).components)
                    ? (description as any).components
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
                    let dx: number[] = [];
                    let dy: number[] = [];
                    let compDx: number[] | null = null;
                    let compDy: number[] | null = null;
                    let compXScale: number[] | null = null;
                    let compYScale: number[] | null = null;
                    let compScale01: number[] | null = null;
                    let compScale10: number[] | null = null;

                    if (!isComposite) {
                        dx = fullDx.slice(0, basePointCount);
                        dy = fullDy.slice(0, basePointCount);
                        const touched = deltas.touched.slice(0, basePointCount);
                        while (dx.length < basePointCount) dx.push(0);
                        while (dy.length < basePointCount) dy.push(0);
                        while (touched.length < basePointCount) touched.push(false);
                        this.applyIupDeltasShared(base, dx, dy, touched);
                    } else if (base instanceof GlyfCompositeDescript) {
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
                            if (!comp) continue;
                            if (comp.hasTwoByTwo()) {
                                const idx1 = tIndex++;
                                const idx2 = tIndex++;
                                compXScale[c] = (fullDx[idx1] ?? 0) / 0x4000;
                                compScale01[c] = (fullDy[idx1] ?? 0) / 0x4000;
                                compScale10[c] = (fullDx[idx2] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx2] ?? 0) / 0x4000;
                            } else if (comp.hasXYScale()) {
                                const idx = tIndex++;
                                compXScale[c] = (fullDx[idx] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx] ?? 0) / 0x4000;
                            } else if (comp.hasScale()) {
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
                        } else {
                            const rawDx = fullDx[p] ?? 0;
                            const rawDy = fullDy[p] ?? 0;
                            const transformed = comp && typeof (comp as any).hasTransform === 'function' && (comp as any).hasTransform() && typeof (comp as any).transformDelta === 'function'
                                ? (comp as any).transformDelta(rawDx, rawDy)
                                : null;
                            const pointDx = transformed ? (transformed.dx ?? rawDx) : rawDx;
                            const pointDy = transformed ? (transformed.dy ?? rawDy) : rawDy;
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            const oy = compIndex >= 0 && compDy ? compDy[compIndex] ?? 0 : 0;
                            x = base.getXCoordinate(p) + pointDx + ox;
                            y = base.getYCoordinate(p) + pointDy + oy;
                        }
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }

                    desc = {
                        getPointCount: () => base.getPointCount(),
                        getContourCount: () => base.getContourCount(),
                        getEndPtOfContours: (c: number) => base.getEndPtOfContours(c),
                        getFlags: (p: number) => base.getFlags(p),
                        getXCoordinate: (p: number) => {
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
                            const rawDx = fullDx[p] ?? 0;
                            const rawDy = fullDy[p] ?? 0;
                            const transformed = comp && typeof (comp as any).hasTransform === 'function' && (comp as any).hasTransform() && typeof (comp as any).transformDelta === 'function'
                                ? (comp as any).transformDelta(rawDx, rawDy)
                                : null;
                            const pointDx = transformed ? (transformed.dx ?? rawDx) : rawDx;
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            return base.getXCoordinate(p) + pointDx + ox;
                        },
                        getYCoordinate: (p: number) => {
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
                            const rawDx = fullDx[p] ?? 0;
                            const rawDy = fullDy[p] ?? 0;
                            const transformed = comp && typeof (comp as any).hasTransform === 'function' && (comp as any).hasTransform() && typeof (comp as any).transformDelta === 'function'
                                ? (comp as any).transformDelta(rawDx, rawDy)
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
                        getInstructions: () => (typeof (base as IGlyphDescription).getInstructions === 'function'
                            ? (base as IGlyphDescription).getInstructions?.() ?? null
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
                return new GlyphData(
                    cff2Desc,
                    hmtx?.getLeftSideBearing?.(i) ?? 0,
                    hmtx?.getAdvanceWidth?.(i) ?? 0,
                    { isCubic: true, includePhantoms: false }
                );
            }
        }
        if (cff) {
            const cffDesc = cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(
                    cffDesc,
                    hmtx?.getLeftSideBearing?.(i) ?? 0,
                    hmtx?.getAdvanceWidth?.(i) ?? 0,
                    { isCubic: true, includePhantoms: cffIncludePhantoms }
                );
            }
        }
        if (glyf) {
            const lsb = hmtx?.getLeftSideBearing?.(i) ?? 0;
            const advance = hmtx?.getAdvanceWidth?.(i) ?? 0;
            const emptyDesc: IGlyphDescription = {
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
                resolve: () => { /* no-op for empty glyph */ },
                getInstructions: () => []
            };
            return new GlyphData(emptyDesc, lsb, advance);
        }
        return null;
    }

    protected applyHintingIfEnabled(
        glyph: GlyphData,
        desc: IGlyphDescription,
        tables: { cvt?: any | null; fpgm?: any | null; prep?: any | null }
    ): void {
        if (!this.hintingEnabled || this.hintingMode !== 'vm-experimental') return;

        const glyphProgram = typeof desc.getInstructions === 'function' ? desc.getInstructions() : null;
        const fpgmProgram = typeof tables.fpgm?.getInstructions === 'function' ? tables.fpgm.getInstructions() : null;
        const prepProgram = typeof tables.prep?.getInstructions === 'function' ? tables.prep.getInstructions() : null;
        const cvtValues = typeof tables.cvt?.getValues === 'function' ? tables.cvt.getValues() : [];
        const result = this.hintVm.runPrograms(glyph, [fpgmProgram, prepProgram, glyphProgram], {
            cvtValues,
            ppem: this.hintingPpem
        });
        if (result.executed && result.unsupportedOpcodeCount > 0) {
            this.emitDiagnostic(
                "HINT_VM_UNSUPPORTED_OPCODE",
                "info",
                "parse",
                "Hint VM ran with unsupported opcodes in vm-experimental mode.",
                { unsupportedOpcodeCount: result.unsupportedOpcodeCount, opCount: result.opCount },
                "HINT_VM_UNSUPPORTED_OPCODE"
            );
        }
    }

    protected applyIupDeltasShared(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void {
        const pointCount = base.getPointCount();
        if (pointCount === 0) return;
        const endPts: number[] = [];
        for (let c = 0; c < base.getContourCount(); c++) {
            endPts.push(base.getEndPtOfContours(c));
        }

        let start = 0;
        for (const end of endPts) {
            const indices: number[] = [];
            const touchedIndices: number[] = [];
            for (let i = start; i <= end; i++) {
                indices.push(i);
                if (touched[i]) touchedIndices.push(i);
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

    protected interpolateShared(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number {
        if (aCoord === bCoord) return aDelta;
        const t = (pCoord - aCoord) / (bCoord - aCoord);
        const clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    }

    protected getGposAttachmentAnchors(glyphId: number, subtables?: Array<any>): MarkAnchor[] {
        const gpos = this.getGposTableForLayout();
        if (!gpos) return [];
        const anchors: MarkAnchor[] = [];
        const activeSubtables = subtables ?? (() => {
            const lookups = gpos?.lookupList?.getLookups?.() ?? [];
            const all: any[] = [];
            for (const lookup of lookups) {
                if (!lookup) continue;
                for (let i = 0; i < lookup.getSubtableCount(); i++) {
                    const st = lookup.getSubtable(i);
                    if (st) all.push(st);
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
                    if (record?.entry) anchors.push({ type: 'cursive-entry', classIndex: 0, x: record.entry.x, y: record.entry.y });
                    if (record?.exit) anchors.push({ type: 'cursive-exit', classIndex: 0, x: record.exit.x, y: record.exit.y });
                }
            }
        }
        return anchors;
    }

    protected applyGposPositioningShared(
        glyphIndices: number[],
        positioned: PositionedGlyph[],
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        const gpos = this.getGposTableForLayout();
        if (!gpos) return;
        const subtables = gpos.getSubtablesForFeatures(gposFeatures, scriptTags);

        for (const st of subtables) {
            if (
                st instanceof SinglePosSubtable ||
                typeof (st as any).getAdjustment === 'function'
            ) {
                for (let i = 0; i < glyphIndices.length; i++) {
                    if (!positioned[i]) continue;
                    const adj = (st as any).getAdjustment?.(glyphIndices[i]);
                    if (!adj) continue;
                    positioned[i].xOffset += adj.xPlacement ?? 0;
                    positioned[i].yOffset += adj.yPlacement ?? 0;
                    positioned[i].xAdvance += adj.xAdvance ?? 0;
                    positioned[i].yAdvance += adj.yAdvance ?? 0;
                }
            }
            if (
                st instanceof PairPosSubtable ||
                st instanceof PairPosFormat1 ||
                st instanceof PairPosFormat2 ||
                typeof (st as any).getPairValue === 'function'
            ) {
                for (let i = 0; i < glyphIndices.length - 1; i++) {
                    if (!positioned[i] || !positioned[i + 1]) continue;
                    const pair = (st as any).getPairValue?.(glyphIndices[i], glyphIndices[i + 1]);
                    if (!pair) continue;
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
            if (
                st instanceof MarkBasePosFormat1 ||
                st instanceof MarkLigPosFormat1 ||
                st instanceof MarkMarkPosFormat1 ||
                st instanceof CursivePosFormat1
            ) {
                continue;
            }
            const constructorName = (st as any)?.constructor?.name ?? "unknown";
            this.emitDiagnostic(
                "UNSUPPORTED_GPOS_SUBTABLE",
                "info",
                "layout",
                `Encountered GPOS subtable not currently handled: ${constructorName}.`,
                { constructorName },
                `UNSUPPORTED_GPOS_SUBTABLE:${constructorName}`
            );
        }

        const markSubtables = subtables.filter((st: any) =>
            st instanceof MarkBasePosFormat1 ||
            st instanceof MarkLigPosFormat1 ||
            st instanceof MarkMarkPosFormat1 ||
            st instanceof CursivePosFormat1
        );

        const anchorsCache = new Map<number, MarkAnchor[]>();
        const getAnchors = (gid: number): MarkAnchor[] => {
            if (anchorsCache.has(gid)) return anchorsCache.get(gid)!;
            const anchors = this.getGposAttachmentAnchors(gid, markSubtables);
            anchorsCache.set(gid, anchors);
            return anchors;
        };
        const getBaseAnchor = (anchors: MarkAnchor[], classIndex: number): MarkAnchor | null => {
            const candidates = anchors.filter(a =>
                (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex
            );
            if (candidates.length === 0) return null;
            const ligatureCandidates = candidates.filter(a => a.type === 'ligature');
            if (ligatureCandidates.length > 0) {
                return ligatureCandidates.reduce((best, current) =>
                    (current.componentIndex ?? -1) > (best.componentIndex ?? -1) ? current : best
                );
            }
            return candidates[0];
        };

        for (let i = 0; i < glyphIndices.length; i++) {
            if (!positioned[i]) continue;
            const anchors = getAnchors(glyphIndices[i]);
            const markAnchor = anchors.find(a => a.type === 'mark');
            if (!markAnchor) continue;

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
            if (attached) continue;

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
            if (!positioned[i]) continue;
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

    protected applyGposPositioningInternal(
        glyphIndices: number[],
        positioned: PositionedGlyph[],
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    public applyGposPositioning(
        glyphIndices: number[],
        positioned: PositionedGlyph[],
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    protected isMarkGlyphClass(glyphId: number): boolean {
        return (this.gdef?.getGlyphClass?.(glyphId) ?? 0) === 3;
    }

    protected getTable(tableType: number): any | null {
        return this.tables.find(tab => tab?.getType?.() === tableType) || null;
    }

    protected parseSfntTables(byteData: ByteArray): void {
        const tf = new TableFactory();
        this.tables = [];
        this.tableDir = new TableDirectory(byteData);
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) this.tables.push(tab);
        }
    }

    protected wireCommonTables(): void {
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.glyf = this.getTable(Table.glyf);
        this.cff = this.getTable(Table.CFF);
        this.head = this.getTable(Table.head);
        this.hhea = this.getTable(Table.hhea);
        this.hmtx = this.getTable(Table.hmtx);
        this.loca = this.getTable(Table.loca);
        this.maxp = this.getTable(Table.maxp);
        this.pName = this.getTable(Table.pName);
        this.post = this.getTable(Table.post);
        this.gsub = this.getTable(Table.GSUB);
        this.kern = this.getTable(Table.kern);
        this.colr = this.getTable(Table.COLR);
        this.cpal = this.getTable(Table.CPAL);
        this.gpos = this.getTable(Table.GPOS);
        this.gdef = this.getTable(Table.GDEF);
        this.svg = this.getTable(Table.SVG);
        this.fvar = this.getTable(Table.fvar);
        this.gvar = this.getTable(Table.gvar);
        this.cvt = this.getTable(Table.cvt);
        this.fpgm = this.getTable(Table.fpgm);
        this.prep = this.getTable(Table.prep);

        const maybeGsubWithGdef = this.gsub as { setGdef?: (gdef: { getGlyphClass?: (glyphId: number) => number } | null) => void } | null;
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef?.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        if (this.fvar && this.fvar.axes.length > 0) {
            const defaults: Record<string, number> = {};
            for (const axis of this.fvar.axes) defaults[axis.name] = axis.defaultValue;
            this.setVariationByAxes(defaults);
        }
        if (this.hmtx && this.maxp) {
            this.hmtx.run(this.hhea?.numberOfHMetrics ?? 0, this.maxp.numGlyphs - (this.hhea?.numberOfHMetrics ?? 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    }

    public getGlyphIndexByChar(char: string): number | null {
        if (!char || char.length === 0) {
            this.emitDiagnostic("INVALID_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar expects a character.");
            return null;
        }
        if (Array.from(char).length > 1) {
            this.emitDiagnostic(
                "MULTI_CHAR_INPUT",
                "warning",
                "parse",
                "getGlyphIndexByChar received multiple characters; using the first code point.",
                undefined,
                "MULTI_CHAR_INPUT"
            );
        }

        const codePoint = char.codePointAt(0);
        if (codePoint == null) {
            this.emitDiagnostic("CODE_POINT_RESOLVE_FAILED", "warning", "parse", "Failed to resolve code point for character.");
            return null;
        }
        if (this.isNonRenderingFormatCodePoint(codePoint)) return null;

        const cmap = this.getCmapTableForLookup();
        if (!cmap) {
            this.emitDiagnostic("MISSING_TABLE_CMAP", "warning", "parse", "No cmap table available.", undefined, "MISSING_TABLE_CMAP");
            return null;
        }

        let cmapFormat: any = null;
        try {
            cmapFormat = this.getBestCmapFormatFor(codePoint);
        } catch {
            this.emitDiagnostic(
                "CMAP_FORMAT_RESOLVE_FAILED",
                "warning",
                "parse",
                "Failed while resolving preferred cmap format; using fallback format order.",
                { codePoint },
                "CMAP_FORMAT_RESOLVE_FAILED"
            );
            const fallbackFormats = Array.isArray(cmap.formats)
                ? cmap.formats.filter((fmt: any): fmt is NonNullable<typeof fmt> => fmt != null)
                : [];
            cmapFormat = this.pickBestFormat(fallbackFormats);
        }
        if (!cmapFormat) {
            this.emitDiagnostic("MISSING_CMAP_FORMAT", "warning", "parse", "No cmap format available for code point.", { codePoint });
            return null;
        }

        let glyphIndex: unknown = null;
        try {
            if (typeof cmapFormat.getGlyphIndex === "function") {
                glyphIndex = cmapFormat.getGlyphIndex(codePoint);
            } else if (typeof cmapFormat.mapCharCode === "function") {
                glyphIndex = cmapFormat.mapCharCode(codePoint);
            } else {
                this.emitDiagnostic(
                    "UNSUPPORTED_CMAP_FORMAT",
                    "warning",
                    "parse",
                    "Selected cmap format does not expose getGlyphIndex/mapCharCode.",
                    { codePoint },
                    "UNSUPPORTED_CMAP_FORMAT"
                );
                return null;
            }
        } catch {
            this.emitDiagnostic(
                "CMAP_LOOKUP_FAILED",
                "warning",
                "parse",
                "cmap glyph lookup failed for code point.",
                { codePoint }
            );
            return null;
        }

        if (typeof glyphIndex !== "number" || !Number.isFinite(glyphIndex) || glyphIndex === 0) return null;
        return glyphIndex;
    }

    public getGlyphByChar(char: string): any | null {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null) return null;
        return this.getGlyphByIndexForLayout(idx);
    }

    public getGlyphIndicesForString(text: string): number[] {
        const glyphs: number[] = [];
        for (const ch of Array.from(text)) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) glyphs.push(idx);
        }
        return glyphs;
    }

    public getGlyphIndicesForStringWithGsub(text: string, featureTags: string[] = ["liga"], scriptTags: string[] = ["DFLT", "latn"]): number[] {
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

    public getKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        const kernTable = this.getKernTableForLayout();
        if (!kernTable) return 0;
        if (typeof kernTable.getKerningValue === "function") {
            try {
                const value = kernTable.getKerningValue(leftGlyph, rightGlyph);
                return typeof value === 'number' && Number.isFinite(value) ? value : 0;
            } catch {
                return 0;
            }
        }
        return 0;
    }

    public getGposKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        const gpos = this.getGposTableForLayout();
        if (!gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        const lookups = gpos.lookupList?.getLookups?.() ?? [];
        let value = 0;
        for (const lookup of lookups) {
            if (!lookup || lookup.getType() !== 2) continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (typeof st?.getKerning === 'function') {
                    try {
                        const kern = st.getKerning(leftGlyph, rightGlyph);
                        value += Number.isFinite(kern) ? kern : 0;
                    } catch {
                        // Ignore malformed pair subtables and continue.
                    }
                }
            }
        }
        return Number.isFinite(value) ? value : 0;
    }

    public getKerningValue(leftChar: string, rightChar: string): number {
        const left = this.getGlyphIndexByChar(leftChar);
        const right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null) return 0;
        const kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0) return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    }

    public layoutString(
        text: string,
        options: { gsubFeatures?: string[]; scriptTags?: string[]; gpos?: boolean; gposFeatures?: string[]; kerning?: boolean } = {}
    ): Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> {
        const gsubFeatures = options.gsubFeatures ?? ["liga"];
        const scriptTags = options.scriptTags ?? ["DFLT", "latn"];
        const kerningEnabled = options.kerning ?? true;
        const gposFeatures = options.gposFeatures ?? (kerningEnabled ? ["kern", "mark", "mkmk", "curs"] : ["mark", "mkmk", "curs"]);
        const glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);

        const positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> = [];
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

    public getTableByType(tableType: number): any | null {
        return this.getTable(tableType);
    }

    public getNumGlyphs(): number {
        return this.maxp?.numGlyphs ?? 0;
    }

    public getAscent(): number {
        return this.hhea?.ascender ?? 0;
    }

    public getDescent(): number {
        return this.hhea?.descender ?? 0;
    }

    public getUnitsPerEm(): number {
        return this.head?.unitsPerEm ?? 1000;
    }

    public getMarkAnchorsForGlyph(
        glyphId: number,
        subtables?: Array<any>
    ): Array<{ type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit'; classIndex: number; x: number; y: number; componentIndex?: number }> {
        return this.getGposAttachmentAnchors(glyphId, subtables);
    }

    public async getSvgDocumentForGlyphAsync(glyphId: number): Promise<{ svgText: string | null; isCompressed: boolean }> {
        if (!this.svg) return { svgText: null, isCompressed: false };
        return this.svg.getSvgDocumentForGlyphAsync(glyphId);
    }

    public getNameInfo(): {
        family: string;
        subfamily: string;
        fullName: string;
        postScriptName: string;
        version: string;
        manufacturer: string;
        designer: string;
        description: string;
        typoFamily: string;
        typoSubfamily: string;
    } {
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

    public getOs2Info(): {
        weightClass: number;
        widthClass: number;
        typoAscender: number;
        typoDescender: number;
        typoLineGap: number;
        winAscent: number;
        winDescent: number;
        unicodeRanges: number[];
        codePageRanges: number[];
        vendorId: string;
        fsSelection: number;
    } | null {
        const os2 = this.getOs2TableForInfo();
        if (!os2) return null;
        const vendorRaw = os2.achVendorID >>> 0;
        const vendorId = String.fromCharCode(
            (vendorRaw >>> 24) & 0xff,
            (vendorRaw >>> 16) & 0xff,
            (vendorRaw >>> 8) & 0xff,
            vendorRaw & 0xff
        ).replace(/\0/g, '');
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

    public getPostInfo(): {
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: number;
    } | null {
        const post = this.getPostTableForInfo();
        if (!post) return null;
        return {
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch
        };
    }

    public layoutStringAuto(
        text: string,
        options: { gpos?: boolean; gposFeatures?: string[]; kerning?: boolean } = {}
    ): PositionedGlyph[] {
        const detection = detectScriptTags(text);
        return this.layoutString(text, {
            gsubFeatures: detection.features,
            scriptTags: detection.scripts,
            gpos: options.gpos ?? true,
            gposFeatures: options.gposFeatures,
            kerning: options.kerning
        });
    }

    public getVariationAxes(): any[] {
        return (this as any).getFvarTableForShared?.()?.axes ?? [];
    }

    public setVariationCoords(coords: number[]): void {
        const copy = coords.slice();
        if (typeof (this as any).setVariationCoordsInternal === 'function') {
            (this as any).setVariationCoordsInternal(copy);
        } else {
            (this as any).variationCoords = copy;
        }
        if (typeof (this as any).onVariationCoordsUpdated === 'function') {
            (this as any).onVariationCoordsUpdated(copy);
        }
    }

    public setVariationByAxes(values: Record<string, number>): void {
        const fvar = (this as any).getFvarTableForShared?.() ?? (this as any).fvar ?? null;
        if (!fvar) return;
        const coords: number[] = [];
        for (const axis of fvar.axes ?? []) {
            const tag = axis.name;
            const value = values[tag] ?? axis.defaultValue;
            let norm = 0;
            if (value !== axis.defaultValue) {
                if (value > axis.defaultValue) {
                    const span = axis.maxValue - axis.defaultValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                } else {
                    const span = axis.defaultValue - axis.minValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
            }
            coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
        }
        this.setVariationCoords(coords);
    }

    public getGlyphPointsByChar(
        char: string,
        options: { sampleStep?: number } = {}
    ): Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> {
        const glyph = this.getGlyphByChar(char);
        if (!glyph) return [];
        const sampleStep = Math.max(1, Math.floor(options.sampleStep ?? 1));
        const points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> = [];
        for (let i = 0; i < glyph.getPointCount(); i += sampleStep) {
            const p = glyph.getPoint(i);
            if (!p) continue;
            points.push({
                x: p.x,
                y: p.y,
                onCurve: p.onCurve,
                endOfContour: p.endOfContour
            });
        }
        return points;
    }

    public measureText(
        text: string,
        options: { gsubFeatures?: string[]; scriptTags?: string[]; gpos?: boolean; gposFeatures?: string[]; letterSpacing?: number } = {}
    ): { advanceWidth: number; glyphCount: number } {
        const layout = this.layoutString(text, options);
        const letterSpacing = Number.isFinite(options.letterSpacing) ? (options.letterSpacing as number) : 0;
        let advanceWidth = 0;
        for (let i = 0; i < layout.length; i++) {
            const xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
            advanceWidth += xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1) advanceWidth += letterSpacing;
        }
        return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
    }

    public layoutToPoints(
        text: string,
        options: {
            x?: number;
            y?: number;
            fontSize?: number;
            sampleStep?: number;
            gsubFeatures?: string[];
            scriptTags?: string[];
            gpos?: boolean;
            gposFeatures?: string[];
            letterSpacing?: number;
        } = {}
    ): {
        points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }>;
        advanceWidth: number;
        scale: number;
    } {
        const layout = this.layoutString(text, options);
        const sampleBase = Number.isFinite(options.sampleStep) ? (options.sampleStep as number) : 1;
        const sampleStep = Math.max(1, Math.floor(sampleBase));
        const unitsPerEm = this.getUnitsPerEmForShared();
        const safeUnitsPerEm = Number.isFinite(unitsPerEm) && unitsPerEm > 0 ? unitsPerEm : 1000;
        const fontSize = Number.isFinite(options.fontSize) && (options.fontSize as number) > 0
            ? (options.fontSize as number)
            : safeUnitsPerEm;
        const scale = fontSize / safeUnitsPerEm;
        const originX = Number.isFinite(options.x) ? (options.x as number) : 0;
        const originY = Number.isFinite(options.y) ? (options.y as number) : 0;
        const letterSpacing = Number.isFinite(options.letterSpacing) ? (options.letterSpacing as number) : 0;
        const points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }> = [];

        let penX = 0;
        for (let i = 0; i < layout.length; i++) {
            const item = layout[i];
            const glyph = this.getGlyphByIndexForLayout(item.glyphIndex);
            if (glyph) {
                for (let pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                    const p = glyph.getPoint(pIndex);
                    if (!p) continue;
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
            if (letterSpacing !== 0 && i < layout.length - 1) penX += letterSpacing;
        }

        return { points, advanceWidth: Number.isFinite(penX) ? penX : 0, scale: Number.isFinite(scale) ? scale : 1 };
    }

    public getColorLayersForGlyph(glyphId: number, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        const colr = this.getColrTableForShared();
        if (!colr) return [];
        const layers = colr.getLayersForGlyph(glyphId);
        if (layers.length === 0) return [];
        const palette = this.getCpalTableForShared()?.getPalette(paletteIndex) ?? [];
        return layers.map((layer: any) => {
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

    public getColorLayersForChar(char: string, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        const glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null) return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    }

    public getColrV1LayersForGlyph(glyphId: number, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        const colr = this.getColrTableForShared();
        if (!colr || colr.version === 0) return [];
        const paint = colr.getPaintForGlyph(glyphId);
        if (!paint) return [];
        return this.flattenColrV1Paint(paint, paletteIndex);
    }

    private flattenColrV1Paint(paint: any, paletteIndex: number): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        if (!paint) return [];
        if (paint.format === 1 && Array.isArray(paint.layers)) {
            return paint.layers.flatMap((p: any) => this.flattenColrV1Paint(p, paletteIndex));
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

    public getNameRecord(nameId: number): string {
        return this.getNameTableForShared()?.getRecord(nameId) ?? "";
    }

    public getAllNameRecords(): Array<{ nameId: number; record: string }> {
        const name = this.getNameTableForShared();
        if (!name) return [];
        return (name.records ?? []).map((r: any) => ({ nameId: r.nameId, record: r.record }));
    }

    public getAllNameRecordsDetailed(): Array<{ nameId: number; record: string; platformId: number; encodingId: number; languageId: number }> {
        const name = this.getNameTableForShared();
        if (!name) return [];
        return (name.records ?? []).map((r: any) => ({
            nameId: r.nameId,
            record: r.record,
            platformId: r.platformId,
            encodingId: r.encodingId,
            languageId: r.languageId
        }));
    }

    public getFontNames(): {
        family: string;
        subfamily: string;
        fullName: string;
        postScriptName: string;
        version: string;
        uniqueSubfamily: string;
        manufacturer: string;
        designer: string;
        description: string;
        vendorUrl: string;
        designerUrl: string;
        license: string;
        licenseUrl: string;
        typographicFamily: string;
        typographicSubfamily: string;
    } {
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

    public getOs2Metrics(): {
        version: number;
        weightClass: number;
        widthClass: number;
        fsType: number;
        fsSelection: number;
        typoAscender: number;
        typoDescender: number;
        typoLineGap: number;
        winAscent: number;
        winDescent: number;
        firstCharIndex: number;
        lastCharIndex: number;
        vendorId: string;
        unicodeRanges: [number, number, number, number];
        codePageRanges: [number, number];
        xHeight: number | null;
        capHeight: number | null;
        defaultChar: number | null;
        breakChar: number | null;
        maxContext: number | null;
        lowerOpticalPointSize: number | null;
        upperOpticalPointSize: number | null;
        panose: {
            familyType: number;
            serifStyle: number;
            weight: number;
            proportion: number;
            contrast: number;
            strokeVariation: number;
            armStyle: number;
            letterform: number;
            midline: number;
            xHeight: number;
        } | null;
    } | null {
        const os2 = this.getOs2TableForShared();
        if (!os2) return null;
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

    public getPostMetrics(): {
        version: number;
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: boolean;
        rawIsFixedPitch: number;
    } | null {
        const post = this.getPostTableForShared();
        if (!post) return null;
        return {
            version: post.version / 65536,
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch !== 0,
            rawIsFixedPitch: post.isFixedPitch
        };
    }

    public getWeightClass(): number {
        return this.getOs2TableForShared()?.usWeightClass ?? 0;
    }

    public getWidthClass(): number {
        return this.getOs2TableForShared()?.usWidthClass ?? 0;
    }

    public getFsTypeFlags(): string[] {
        const fsType = this.getOs2TableForShared()?.fsType ?? 0;
        if (fsType === 0) return ['installable-embedding'];
        const flags: string[] = [];
        if (fsType & 0x0002) flags.push('restricted-license-embedding');
        if (fsType & 0x0004) flags.push('preview-print-embedding');
        if (fsType & 0x0008) flags.push('editable-embedding');
        if (fsType & 0x0100) flags.push('no-subsetting');
        if (fsType & 0x0200) flags.push('bitmap-embedding-only');
        return flags;
    }

    public getFsSelectionFlags(): string[] {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        const flags: string[] = [];
        if (fsSelection & 0x0001) flags.push('italic');
        if (fsSelection & 0x0002) flags.push('underscore');
        if (fsSelection & 0x0004) flags.push('negative');
        if (fsSelection & 0x0008) flags.push('outlined');
        if (fsSelection & 0x0010) flags.push('strikeout');
        if (fsSelection & 0x0020) flags.push('bold');
        if (fsSelection & 0x0040) flags.push('regular');
        if (fsSelection & 0x0080) flags.push('use-typo-metrics');
        if (fsSelection & 0x0100) flags.push('wws');
        if (fsSelection & 0x0200) flags.push('oblique');
        return flags;
    }

    public isItalic(): boolean {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        if (fsSelection & 0x0001) return true;
        if (fsSelection & 0x0200) return true;
        if ((this.getPostTableForShared()?.italicAngle ?? 0) !== 0) return true;
        const subfamily = this.getPreferredNameRecord(2).toLowerCase();
        return subfamily.includes('italic') || subfamily.includes('oblique');
    }

    public isBold(): boolean {
        const fsSelection = this.getOs2TableForShared()?.fsSelection ?? 0;
        if (fsSelection & 0x0020) return true;
        if ((this.getOs2TableForShared()?.usWeightClass ?? 0) >= 700) return true;
        return this.getPreferredNameRecord(2).toLowerCase().includes('bold');
    }

    public isMonospace(): boolean {
        return (this.getPostTableForShared()?.isFixedPitch ?? 0) !== 0;
    }

    public getMetadata(): {
        names: ReturnType<BaseFontParser['getFontNames']>;
        nameRecords: ReturnType<BaseFontParser['getAllNameRecordsDetailed']>;
        os2: ReturnType<BaseFontParser['getOs2Metrics']>;
        post: ReturnType<BaseFontParser['getPostMetrics']>;
        style: {
            isBold: boolean;
            isItalic: boolean;
            isMonospace: boolean;
            weightClass: number;
            widthClass: number;
            fsTypeFlags: string[];
            fsSelectionFlags: string[];
        };
    } {
        return {
            names: this.getFontNames(),
            nameRecords: this.getAllNameRecordsDetailed(),
            os2: this.getOs2Metrics(),
            post: this.getPostMetrics(),
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

    private getPreferredNameRecord(nameId: number): string {
        const name = this.getNameTableForShared();
        if (!name || (name.records ?? []).length === 0) return '';
        const candidates = (name.records ?? []).filter((r: any) => r.nameId === nameId && !!r.record && r.record.trim().length > 0);
        if (candidates.length === 0) return '';
        const score = (rec: { platformId: number; languageId: number }): number => {
            let s = 0;
            if (rec.platformId === Table.platformMicrosoft) s += 100;
            else if (rec.platformId === Table.platformAppleUnicode) s += 80;
            else if (rec.platformId === Table.platformMacintosh) s += 60;
            if (rec.languageId === 0x0409) s += 30;
            if (rec.languageId === 0) s += 10;
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

    private decodeOs2VendorId(vendor: number): string {
        const n = vendor >>> 0;
        const text = String.fromCharCode(
            (n >>> 24) & 0xff,
            (n >>> 16) & 0xff,
            (n >>> 8) & 0xff,
            n & 0xff
        );
        return text.replace(/\0/g, '').trim();
    }
}
