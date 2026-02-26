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

export class FontParserTTF {
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


    public getGlyphIndexByChar(char: string): number | null {
        if (char.length !== 1) {
            console.error("getGlyphIndexByChar expects a single character");
            return null;
        }

        const codePoint = char.codePointAt(0); // Convert character to Unicode code point
        if (codePoint == null) {
            console.error("Failed to get code point for character");
            return null;
        }

        if (!this.cmap) {
            console.warn("No cmap table available");
            return null;
        }

        const cmapFormat = this.getBestCmapFormat();
        if (!cmapFormat) {
            console.warn("No cmap format available");
            return null;
        }

        const glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);

        if (glyphIndex == null || glyphIndex === 0) {
            console.warn(`No glyph found for code point: ${codePoint}`);
            return null;
        }

        return glyphIndex;
    }

    public getGlyphByChar(char: string): GlyphData | null {
        const glyphIndex = this.getGlyphIndexByChar(char);
        if (glyphIndex == null) return null;
        return this.getGlyph(glyphIndex);
    }

    public getGlyphIndicesForString(text: string): number[] {
        const indices: number[] = [];
        for (const ch of text) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) indices.push(idx);
        }
        return indices;
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

    public getNameRecord(nameId: number): string {
        return this.pName?.getRecord(nameId) ?? "";
    }

    public getAllNameRecords(): Array<{ nameId: number; record: string }> {
        if (!this.pName) return [];
        return this.pName.records.map(r => ({ nameId: r.nameId, record: r.record }));
    }

    // Return a table by type
    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
    }

    private getBestCmapFormat(): any | null {
        if (!this.cmap) return null;

        const preferred = [
            { platformId: 3, encodingId: 1 },  // Windows, Unicode BMP
            { platformId: 3, encodingId: 10 }, // Windows, UCS-4
            { platformId: 0, encodingId: 4 },  // Unicode, UCS-4
            { platformId: 0, encodingId: 3 },  // Unicode, BMP
            { platformId: 0, encodingId: 1 },  // Unicode, 1.1
            { platformId: 1, encodingId: 0 },  // Macintosh, Roman
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
//     private getTable( tableType:any )
//     {
//         for (var i=0; i < this.tables.length; i++)
//         {
//             if( (this.tables[i] != null) && (this.tables[i].getType() == tableType) )
//             {
//                 return this.tables[i];
//             }
//         }
//         return null;
//     } 


}
