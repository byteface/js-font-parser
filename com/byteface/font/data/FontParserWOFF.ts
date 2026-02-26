import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
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

export class FontParserWOFF {
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private head: HeadTable | null = null;
    private hhea: HheaTable | null = null;
    private hmtx: HmtxTable | null = null;
    private loca: LocaTable | null = null;
    private maxp: MaxpTable | null = null;
    private pName: NameTable | null = null;
    private post: PostTable | null = null;

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: Array<any> = [];

    constructor(byteData: ByteArray) {
        this.init(byteData);
    }

    // Initialize the FontParserWOFF instance
    private init(byteData: ByteArray): void {
        // Read the WOFF header
        const woffVersion = byteData.readUInt(); // 4 bytes
        const woffSize = byteData.readUInt(); // 4 bytes
        const woffNumTables = byteData.readUnsignedShort(); // 2 bytes
        const woffReserved = byteData.readUnsignedShort(); // 2 bytes
        const woffTotalSfntSize = byteData.readUInt(); // 4 bytes
        const woffMajorVersion = byteData.readUnsignedShort(); // 2 bytes
        const woffMinorVersion = byteData.readUnsignedShort(); // 2 bytes
        const woffMetaOffset = byteData.readUInt(); // 4 bytes
        const woffMetaLength = byteData.readUInt(); // 4 bytes
        const woffMetadata = byteData.readUInt(); // 4 bytes

        // Initialize the table directory
        this.tables = [];
        let offset = 0;

        // Read each table
        for (let i = 0; i < woffNumTables; i++) {
            const tag = byteData.readUInt(); // 4 bytes
            const offsetTable = byteData.readUInt(); // 4 bytes
            const lengthTable = byteData.readUInt(); // 4 bytes
            const checksumTable = byteData.readUInt(); // 4 bytes

            // Store table information for later extraction
            this.tables.push({ tag, offset: offsetTable, length: lengthTable });
        }

        // Extract and parse the underlying TTF data
        // (Assuming tables are in a contiguous block after the WOFF header)
        // const ttfData = byteData.subarray(woffNumTables * 12 + 44); // Calculate the TTF data position
        // Assuming byteData is an instance of ByteArray, convert it to Uint8Array
        const ttfData = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength).subarray(woffNumTables * 12 + 44);

        this.parseTTF(new ByteArray(ttfData));
    }

    private parseTTF(byteData: ByteArray): void {
        // Load TTF tables from the extracted byte data
        const tf = new TableFactory();
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
        this.head = this.getTable(Table.head) as HeadTable | null;
        this.hhea = this.getTable(Table.hhea) as HheaTable | null;
        this.hmtx = this.getTable(Table.hmtx) as HmtxTable | null;
        this.loca = this.getTable(Table.loca) as LocaTable | null;
        this.maxp = this.getTable(Table.maxp) as MaxpTable | null;
        this.pName = this.getTable(Table.pName) as NameTable | null;
        this.post = this.getTable(Table.post) as PostTable | null;

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
        const description = this.glyf?.getDescription(i);
        return description != null
            ? new GlyphData(description, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0)
            : null;
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

    public getGlyphIndexByChar(char: string): number | null {
        if (char.length !== 1) {
            console.error("getGlyphIndexByChar expects a single character");
            return null;
        }

        const codePoint = char.codePointAt(0);
        if (codePoint == null) return null;

        if (!this.cmap) return null;
        const cmapFormat = this.getBestCmapFormat();
        if (!cmapFormat) return null;

        const glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);

        if (glyphIndex == null || glyphIndex === 0) return null;
        return glyphIndex;
    }

    public getGlyphByChar(char: string): GlyphData | null {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null) return null;
        return this.getGlyph(idx);
    }

    public getTableByType(tableType: number): ITable | null {
        return this.getTable(tableType);
    }

    // Return a table by type
    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
    }

    private getBestCmapFormat(): any | null {
        if (!this.cmap) return null;
        const preferred = [
            { platformId: 3, encodingId: 1 },
            { platformId: 3, encodingId: 10 },
            { platformId: 0, encodingId: 4 },
            { platformId: 0, encodingId: 3 },
            { platformId: 0, encodingId: 1 },
            { platformId: 1, encodingId: 0 }
        ];

        for (const pref of preferred) {
            const formats = this.cmap.getCmapFormats(pref.platformId, pref.encodingId);
            if (formats.length > 0) {
                return this.pickBestFormat(formats);
            }
        }

        return this.cmap.formats.length > 0 ? this.pickBestFormat(this.cmap.formats) : null;
    }

    private pickBestFormat(formats: any[]): any | null {
        if (formats.length === 0) return null;
        const order = [4, 12, 10, 8, 6, 2, 0];
        for (const fmt of order) {
            const found = formats.find(f => (typeof f.getFormatType === "function" ? f.getFormatType() : f.format) === fmt);
            if (found) return found;
        }
        return formats[0];
    }
}
