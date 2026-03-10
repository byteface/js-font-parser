import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { CffTable } from '../table/CffTable.js';
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
import { SvgTable } from '../table/SvgTable.js';
import { FvarTable } from '../table/FvarTable.js';
import { GvarTable } from '../table/GvarTable.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';
import { BaseFontParser } from './BaseFontParser.js';

export class FontParserWOFF extends BaseFontParser {
    private static readonly WOFF_SIGNATURE = 0x774f4646;
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private cff: CffTable | null = null;
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
    private svg: SvgTable | null = null;
    private fvar: FvarTable | null = null;
    private gvar: GvarTable | null = null;
    private variationCoords: number[] = [];

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: ITable[] = [];

    constructor(byteData: ByteArray, options?: { format?: 'woff' | 'sfnt' }) {
        super();
        if (options?.format === 'sfnt') {
            this.parseTTF(byteData);
        } else {
            this.init(byteData);
        }
    }

    static async load(url: string): Promise<FontParserWOFF> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        const sfnt = await this.decodeWoffToSfnt(buffer);
        return new FontParserWOFF(new ByteArray(sfnt), { format: 'sfnt' });
    }

    // Initialize from raw WOFF bytes. This sync path supports only stored (uncompressed)
    // table payloads; compressed WOFF should use FontParserWOFF.load().
    private init(byteData: ByteArray): void {
        const rawBytes = new Uint8Array(
            byteData.dataView.buffer,
            byteData.dataView.byteOffset,
            byteData.dataView.byteLength
        );
        try {
            const sfnt = FontParserWOFF.decodeWoffToSfntSync(rawBytes);
            this.parseTTF(new ByteArray(sfnt));
            return;
        } catch (error) {
            const message = (error as Error)?.message ?? "";
            if (!/Compressed WOFF table detected/i.test(message)) {
                throw error;
            }
            // Compatibility fallback: retain legacy behavior for compressed WOFF
            // in sync call sites (FontParser.fromArrayBuffer).
            this.parseTTF(new ByteArray(rawBytes));
        }
    }

    private static readUint32(view: DataView, offset: number): number {
        return view.getUint32(offset, false);
    }

    private static readUint16(view: DataView, offset: number): number {
        return view.getUint16(offset, false);
    }

    private static assertNonOverlappingTableRanges(entries: Array<{ offset: number; compLength: number }>): void {
        const byOffset = [...entries].sort((a, b) => a.offset - b.offset);
        for (let i = 1; i < byOffset.length; i++) {
            const prev = byOffset[i - 1];
            const curr = byOffset[i];
            const prevEnd = prev.offset + prev.compLength;
            if (curr.offset < prevEnd) {
                throw new Error('Invalid WOFF table entry: overlapping table data ranges.');
            }
        }
    }

    private static decodeWoffToSfntSync(buffer: Uint8Array): Uint8Array {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        if (view.byteLength < 44) {
            throw new Error('Invalid WOFF input: too short.');
        }
        const signature = this.readUint32(view, 0);
        if (signature !== this.WOFF_SIGNATURE) {
            throw new Error('Not a valid WOFF file.');
        }
        const flavor = this.readUint32(view, 4);
        const declaredLength = this.readUint32(view, 8);
        const numTables = this.readUint16(view, 12);
        const totalSfntSize = this.readUint32(view, 16);
        if (declaredLength !== view.byteLength) {
            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
        }
        if (numTables <= 0) {
            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
        }

        const tableDirOffset = 44;
        if (tableDirOffset + numTables * 20 > view.byteLength) {
            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
        }

        const entries: Array<{ tag: number; offset: number; compLength: number; origLength: number; checksum: number }> = [];
        for (let i = 0; i < numTables; i++) {
            const offset = tableDirOffset + i * 20;
            const entry = {
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            };
            if (entry.offset > view.byteLength || entry.compLength > view.byteLength - entry.offset) {
                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
            }
            if (entry.compLength !== entry.origLength) {
                throw new Error('Compressed WOFF table detected in sync path. Use FontParserWOFF.load() for decompression support.');
            }
            entries.push(entry);
        }
        this.assertNonOverlappingTableRanges(entries);

        entries.sort((a, b) => a.tag - b.tag);
        const maxPower = 2 ** Math.floor(Math.log2(numTables));
        const searchRange = maxPower * 16;
        const entrySelector = Math.log2(maxPower);
        const rangeShift = numTables * 16 - searchRange;

        if (totalSfntSize < 12 + numTables * 16) {
            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
        }
        const sfntBuffer = new ArrayBuffer(totalSfntSize);
        const sfntView = new DataView(sfntBuffer);
        sfntView.setUint32(0, flavor, false);
        sfntView.setUint16(4, numTables, false);
        sfntView.setUint16(6, searchRange, false);
        sfntView.setUint16(8, entrySelector, false);
        sfntView.setUint16(10, rangeShift, false);

        let dataOffset = 12 + numTables * 16;
        const tableRecords = [];
        for (const entry of entries) {
            dataOffset = (dataOffset + 3) & ~3;
            tableRecords.push({ ...entry, sfntOffset: dataOffset });
            if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
            }
            const source = new Uint8Array(buffer.buffer, buffer.byteOffset + entry.offset, entry.origLength);
            const target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
            target.set(source);
            dataOffset += entry.origLength;
        }

        tableRecords.forEach((record, i) => {
            const base = 12 + i * 16;
            sfntView.setUint32(base, record.tag, false);
            sfntView.setUint32(base + 4, record.checksum, false);
            sfntView.setUint32(base + 8, record.sfntOffset, false);
            sfntView.setUint32(base + 12, record.origLength, false);
        });

        return new Uint8Array(sfntBuffer);
    }

    private static async inflate(data: Uint8Array): Promise<Uint8Array> {
        if (typeof DecompressionStream === 'undefined') {
            throw new Error('WOFF decompression requires DecompressionStream (not available).');
        }
        const stream = new DecompressionStream('deflate');
        const payload = new Uint8Array(data);
        const response = new Response(payload).body;
        if (!response) throw new Error('Failed to create response body for decompression.');
        const decompressed = response.pipeThrough(stream);
        const buffer = await new Response(decompressed).arrayBuffer();
        return new Uint8Array(buffer);
    }

    private static async decodeWoffToSfnt(buffer: ArrayBuffer): Promise<Uint8Array> {
        const view = new DataView(buffer);
        const signature = this.readUint32(view, 0);
        if (signature !== 0x774f4646) {
            throw new Error('Not a valid WOFF file.');
        }

        const flavor = this.readUint32(view, 4);
        const length = this.readUint32(view, 8);
        const numTables = this.readUint16(view, 12);
        const totalSfntSize = this.readUint32(view, 16);

        if (length !== buffer.byteLength) {
            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
        }
        if (numTables <= 0) {
            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
        }

        const tableDirOffset = 44;
        if (tableDirOffset + numTables * 20 > buffer.byteLength) {
            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
        }
        const entries = [];
        for (let i = 0; i < numTables; i++) {
            const offset = tableDirOffset + i * 20;
            const entry = {
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            };
            if (entry.offset > buffer.byteLength || entry.compLength > buffer.byteLength - entry.offset) {
                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
            }
            if (entry.compLength > entry.origLength) {
                throw new Error('Invalid WOFF table entry: compLength cannot exceed origLength.');
            }
            entries.push(entry);
        }
        this.assertNonOverlappingTableRanges(entries);

        entries.sort((a, b) => a.tag - b.tag);

        const maxPower = 2 ** Math.floor(Math.log2(numTables));
        const searchRange = maxPower * 16;
        const entrySelector = Math.log2(maxPower);
        const rangeShift = numTables * 16 - searchRange;

        if (totalSfntSize < 12 + numTables * 16) {
            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
        }
        const sfntBuffer = new ArrayBuffer(totalSfntSize);
        const sfntView = new DataView(sfntBuffer);
        sfntView.setUint32(0, flavor, false);
        sfntView.setUint16(4, numTables, false);
        sfntView.setUint16(6, searchRange, false);
        sfntView.setUint16(8, entrySelector, false);
        sfntView.setUint16(10, rangeShift, false);

        let dataOffset = 12 + numTables * 16;
        const tableRecords = [];

        for (const entry of entries) {
            const aligned = (dataOffset + 3) & ~3;
            dataOffset = aligned;
            tableRecords.push({ ...entry, sfntOffset: dataOffset });

            const tableData = new Uint8Array(buffer, entry.offset, entry.compLength);
            let decoded: Uint8Array = tableData;
            if (entry.compLength < entry.origLength) {
                decoded = await this.inflate(tableData);
            }
            if (decoded.length < entry.origLength) {
                throw new Error('Invalid WOFF table entry: decompressed data shorter than origLength.');
            }
            if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
            }
            const target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
            target.set(decoded.subarray(0, entry.origLength));
            dataOffset += entry.origLength;
        }

        tableRecords.forEach((record, i) => {
            const base = 12 + i * 16;
            sfntView.setUint32(base, record.tag, false);
            sfntView.setUint32(base + 4, record.checksum, false);
            sfntView.setUint32(base + 8, record.sfntOffset, false);
            sfntView.setUint32(base + 12, record.origLength, false);
        });

        return new Uint8Array(sfntBuffer);
    }

    private parseTTF(byteData: ByteArray): void {
        // Load TTF tables from the extracted byte data
        const tf = new TableFactory();
        // Reset any legacy WOFF directory entries so only parsed table objects remain.
        this.tables = [];
        this.tableDir = new TableDirectory(byteData);
        
        for (let i = 0; i < this.tableDir.numTables; i++) {
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
        this.svg = this.getTable(Table.SVG) as SvgTable | null;
        this.fvar = this.getTable(Table.fvar) as FvarTable | null;
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

    // Get a glyph description by index
    public getGlyph(i: number): GlyphData | null {
        return this.getGlyphShared(i, {
            maxGlyphs: this.maxp?.numGlyphs ?? null,
            glyf: this.glyf,
            hmtx: this.hmtx,
            gvar: this.gvar,
            variationCoords: this.variationCoords,
            cff: this.cff,
            cffIncludePhantoms: true
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
        if (this.colr && typeof (this.colr as any).setVariationCoords === 'function') {
            (this.colr as any).setVariationCoords(coords);
        }
    }
}
