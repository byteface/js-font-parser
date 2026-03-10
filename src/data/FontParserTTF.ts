import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
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
import { ITable } from '../table/ITable.js';
import { GsubTable } from '../table/GsubTable.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
import { ColrTable } from '../table/ColrTable.js';
import { CpalTable } from '../table/CpalTable.js';
import { GposTable } from '../table/GposTable.js';
import { FvarTable } from '../table/FvarTable.js';
import { SvgTable } from '../table/SvgTable.js';
import { GvarTable } from '../table/GvarTable.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';
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
        return this.getGlyphShared(i, {
            maxGlyphs: this.maxp?.numGlyphs ?? null,
            glyf: this.glyf,
            hmtx: this.hmtx,
            gvar: this.gvar,
            variationCoords: this.variationCoords,
            cff: this.cff,
            cff2: this.cff2,
            cffIncludePhantoms: false
        });
    }

    private applyIupDeltas(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void {
        this.applyIupDeltasShared(base, dx, dy, touched);
    }

    private interpolate(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number {
        return this.interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord);
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
