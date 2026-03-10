import { ByteArray } from '../utils/ByteArray.js';
import { Cff2Table } from '../table/Cff2Table.js';
import { Table } from '../table/Table.js';
import { GlyphData } from './GlyphData.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';
import { BaseFontParser } from './BaseFontParser.js';

export class FontParserTTF extends BaseFontParser {
    private cff2: Cff2Table | null = null;

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
        this.parseSfntTables(byteData);
        this.wireCommonTables();
        this.cff2 = this.getTable(Table.CFF2) as Cff2Table | null;
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

    protected onVariationCoordsUpdated(coords: number[]): void {
        if (this.cff2) this.cff2.setVariationCoords(coords);
        super.onVariationCoordsUpdated(coords);
    }
}
