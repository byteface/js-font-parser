import { ByteArray } from '../utils/ByteArray.js';
import { Table } from '../table/Table.js';
import { BaseFontParser } from './BaseFontParser.js';
export class FontParserTTF extends BaseFontParser {
    cff2 = null;
    // Static load method that returns a Promise
    static load(url) {
        return fetch(url)
            .then(response => {
            if (!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);
            return response.arrayBuffer();
        })
            .then(arrayBuffer => new ByteArray(new Uint8Array(arrayBuffer))) // Wrap in ByteArray
            .then(byteArray => new FontParserTTF(byteArray)); // Create and initialize FontParserTTF
    }
    constructor(byteData) {
        super();
        this.init(byteData);
    }
    // Initialize the FontParserTTF instance
    init(byteData) {
        this.parseSfntTables(byteData);
        this.wireCommonTables();
        this.cff2 = this.getTable(Table.CFF2);
    }
    // Get a glyph description by index
    getGlyph(i) {
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
    applyIupDeltas(base, dx, dy, touched) {
        this.applyIupDeltasShared(base, dx, dy, touched);
    }
    interpolate(aCoord, bCoord, aDelta, bDelta, pCoord) {
        return this.interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord);
    }
    onVariationCoordsUpdated(coords) {
        if (this.cff2)
            this.cff2.setVariationCoords(coords);
        super.onVariationCoordsUpdated(coords);
    }
}
