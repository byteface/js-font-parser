import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
import { CffTable } from '../table/CffTable.js';
import { Cff2Table } from '../table/Cff2Table.js';
import { HeadTable } from '../table/HeadTable.js';
import { HheaTable } from '../table/HheaTable.js';
import { HmtxTable } from '../table/HmtxTable.js';
import { LocaTable } from '../table/LocaTable.js';
import { MaxpTable } from '../table/MaxpTable.js';
import { NameTable } from '../table/NameTable.js';
import { PostTable } from '../table/PostTable.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';
import { ITable } from '../table/ITable.js';
import { GsubTable } from '../table/GsubTable.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
import { ColrTable } from '../table/ColrTable.js';
import { CpalTable } from '../table/CpalTable.js';
import { GposTable } from '../table/GposTable.js';
import { FvarTable } from '../table/FvarTable.js';
import { SvgTable } from '../table/SvgTable.js';
import { GvarTable } from '../table/GvarTable.js';
import { BaseFontParser } from './BaseFontParser.js';

export class FontParserTTF extends BaseFontParser {
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private cff: CffTable | null = null;
    private cff2: Cff2Table | null = null;
    private head: HeadTable | null = null;
    private hhea: HheaTable | null = null;
    private hmtx: HmtxTable | null = null;
    private loca: LocaTable | null = null;
    private maxp: MaxpTable | null = null;
    private pName: NameTable | null = null;
    private post: PostTable | null = null;
    private gsub: GsubTable | null = null;
    private kern: { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null = null;
    private colr: ColrTable | null = null;
    private cpal: CpalTable | null = null;
    private gpos: GposTable | null = null;
    private gdef: { getGlyphClass?: (glyphId: number) => number } | null = null;
    private fvar: FvarTable | null = null;
    private svg: SvgTable | null = null;
    private gvar: GvarTable | null = null;
    private variationCoords: number[] = [];

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: ITable[] = [];

    // Static load method that returns a Promise
    static load(url: string): Promise<FontParserTTF> {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.arrayBuffer();
            })
            .then(arrayBuffer => new ByteArray(new Uint8Array(arrayBuffer))) // Wrap in ByteArray
            .then(byteArray => new FontParserTTF(byteArray)) // Create and initialize FontParserTTF
            .catch(error => {
                console.error('Error loading font:', error);
                throw error; // Propagate error for further handling if needed
            });
    }

    constructor(byteData: ByteArray) {
        super();
        this.init(byteData);
    }

    // Initialize the FontParserTTF instance
    private init(byteData: ByteArray): void {
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];

        // Load each of the tables
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tf = new TableFactory();
            const tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }

        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2) as Os2Table | null;
        this.cmap = this.getTable(Table.cmap) as CmapTable | null;
        this.glyf = this.getTable(Table.glyf) as GlyfTable | null;
        this.cff = this.getTable(Table.CFF) as CffTable | null;
        this.cff2 = this.getTable(Table.CFF2) as Cff2Table | null;
        this.head = this.getTable(Table.head) as HeadTable | null;
        this.hhea = this.getTable(Table.hhea) as HheaTable | null;
        this.hmtx = this.getTable(Table.hmtx) as HmtxTable | null;
        this.loca = this.getTable(Table.loca) as LocaTable | null;
        this.maxp = this.getTable(Table.maxp) as MaxpTable | null;
        this.pName = this.getTable(Table.pName) as NameTable | null;
        this.post = this.getTable(Table.post) as PostTable | null;
        this.gsub = this.getTable(Table.GSUB) as GsubTable | null;
        this.kern = this.getTable(Table.kern) as { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null;
        this.colr = this.getTable(Table.COLR) as ColrTable | null;
        this.cpal = this.getTable(Table.CPAL) as CpalTable | null;
        this.gpos = this.getTable(Table.GPOS) as GposTable | null;
        this.gdef = this.getTable(Table.GDEF) as { getGlyphClass?: (glyphId: number) => number } | null;
        const maybeGsubWithGdef = this.gsub as GsubTable & { setGdef?: (gdef: { getGlyphClass?: (glyphId: number) => number } | null) => void };
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        this.fvar = this.getTable(Table.fvar) as FvarTable | null;
        this.svg = this.getTable(Table.SVG) as SvgTable | null;
        this.gvar = this.getTable(Table.gvar) as GvarTable | null;
        if (this.fvar && this.fvar.axes.length > 0) {
            const defaults: Record<string, number> = {};
            for (const axis of this.fvar.axes) defaults[axis.name] = axis.defaultValue;
            this.setVariationByAxes(defaults);
        }

        // Initialize the tables
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

    /**
     * Apply GPOS value and attachment adjustments to an already-shaped run.
     * Attachment positioning runs after value positioning so mark anchors
     * inherit parent/base offsets introduced earlier in the run.
     */
    private applyGposPositioningInternal(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>,
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    // Backward-compatible alias used by tests/tools that call this directly.
    public applyGposPositioning(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>,
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    private isMarkGlyphClass(glyphId: number): boolean {
        return (this.gdef?.getGlyphClass?.(glyphId) ?? 0) === 3;
    }

    // Get a glyph description by index
    public getGlyph(i: number): GlyphData | null {
        const description = this.glyf?.getDescription(i);
        if (description != null) {
            let desc = description;
            let lsb = this.hmtx?.getLeftSideBearing(i) ?? 0;
            let advance = this.hmtx?.getAdvanceWidth(i) ?? 0;
            if (this.gvar && this.variationCoords.length > 0) {
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
                const gvarPointCount = compositePointCount + 4; // phantom points
                const deltas = this.gvar.getDeltasForGlyph(i, this.variationCoords, gvarPointCount);
                if (deltas) {
                    const self = this;
                    const base = description;
                    const compositeBase = isComposite && base instanceof GlyfCompositeDescript ? base : null;
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
                        this.applyIupDeltas(base, dx, dy, touched);
                    } else if (base instanceof GlyfCompositeDescript) {
                        compDx = new Array(componentCount).fill(0);
                        compDy = new Array(componentCount).fill(0);
                        compXScale = new Array(componentCount).fill(0);
                        compYScale = new Array(componentCount).fill(0);
                        compScale01 = new Array(componentCount).fill(0);
                        compScale10 = new Array(componentCount).fill(0);
                        for (let c = 0; c < componentCount; c++) {
                            const rawDx = fullDx[c] ?? 0;
                            const rawDy = fullDy[c] ?? 0;
                            compDx[c] = rawDx;
                            compDy[c] = rawDy;
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
                        if (comp && compIndex >= 0 && self.glyf) {
                            const gd = self.glyf.getDescription(comp.glyphIndex);
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
                            if (comp && compIndex >= 0 && self.glyf) {
                                const gd = self.glyf.getDescription(comp.glyphIndex);
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
                            if (comp && compIndex >= 0 && self.glyf) {
                                const gd = self.glyf.getDescription(comp.glyphIndex);
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
                        resolve: () => base.resolve()
                    };
                }
            }
            return new GlyphData(desc, lsb, advance);
        }
        if (this.cff2) {
            const cff2Desc = this.cff2.getGlyphDescription(i);
            if (cff2Desc) {
                return new GlyphData(
                    cff2Desc,
                    this.hmtx?.getLeftSideBearing(i) ?? 0,
                    this.hmtx?.getAdvanceWidth(i) ?? 0,
                    { isCubic: true, includePhantoms: false }
                );
            }
        }
        if (this.cff) {
            const cffDesc = this.cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(
                    cffDesc,
                    this.hmtx?.getLeftSideBearing(i) ?? 0,
                    this.hmtx?.getAdvanceWidth(i) ?? 0,
                    { isCubic: true, includePhantoms: false }
                );
            }
        }
        return null;
    }

    // Get the number of glyphs
    public getNumGlyphs(): number {
        return this.maxp?.numGlyphs ?? 0;
    }

    // Get the ascent value
    public getAscent(): number {
        return this.hhea?.ascender ?? 0;
    }

    // Get the descent value
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

    private applyIupDeltas(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void {
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
                for (const i of indices) {
                    dx[i] = dx[idx];
                    dy[i] = dy[idx];
                }
                start = end + 1;
                continue;
            }

            const contour = indices;
            const total = contour.length;
            const order = touchedIndices.map(i => contour.indexOf(i)).sort((a, b) => a - b);
            const coordsX = contour.map(i => base.getXCoordinate(i));
            const coordsY = contour.map(i => base.getYCoordinate(i));

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
                    dx[globalIndex] = this.interpolate(ax, bx, dx[contour[a]], dx[contour[b]], px);
                    dy[globalIndex] = this.interpolate(ay, by, dy[contour[a]], dy[contour[b]], py);
                    idx = (idx + 1) % total;
                }
            }
            start = end + 1;
        }
    }

    private interpolate(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number {
        if (aCoord === bCoord) return aDelta;
        const t = (pCoord - aCoord) / (bCoord - aCoord);
        const clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    }

    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
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

    protected getGlyphByIndexForLayout(glyphIndex: number): { advanceWidth?: number } | null {
        return this.getGlyph(glyphIndex);
    }

    protected isMarkGlyphForLayout(glyphIndex: number): boolean {
        return this.isMarkGlyphClass(glyphIndex);
    }

    protected applyGposPositioningForLayout(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>,
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    }

    protected getTableByTypeInternal(tableType: number): any | null {
        return this.getTable(tableType);
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

    protected getCmapTableForLookup(): any | null {
        return this.cmap as any;
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
        if (this.cff2) this.cff2.setVariationCoords(coords);
        if (this.colr && typeof (this.colr as any).setVariationCoords === 'function') {
            (this.colr as any).setVariationCoords(coords);
        }
    }
}
