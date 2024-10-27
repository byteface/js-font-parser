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


    public getGlyphIndexByChar(char: string): GlyphData | null {
        if (char.length !== 1) {
            console.error("getGlyphByChar expects a single character");
            return null;
        }

        const codePoint = char.codePointAt(0); // Convert character to Unicode code point
        if (codePoint == null) {
            console.error("Failed to get code point for character");
            return null;
        }

        // TODO - we need some way to get platformId and encodingId
        const platformId = 1; // TODO - Determine the platform ID
        const encodingId = 0; // TODO - Determine the encoding ID
        
        const cmapFormat = this.cmap.getCmapFormat(platformId, encodingId);
        if (!cmapFormat) {
            console.warn(`No cmap format found for platformId: ${platformId}, encodingId: ${encodingId}`);
            return null;
        }

        const glyphIndex = cmapFormat.getGlyphIndex(codePoint);
        if (glyphIndex == null) {
            console.warn(`No glyph found for code point: ${codePoint}`);
            return null;
        }

        // return this.getGlyph(glyphIndex);
        return glyphIndex;
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

    // Return a table by type
    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
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
