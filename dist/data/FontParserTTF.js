var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ByteArray } from '../utils/ByteArray.js';
import { Table } from '../table/Table.js';
import { BaseFontParser } from './BaseFontParser.js';
var FontParserTTF = /** @class */ (function (_super) {
    __extends(FontParserTTF, _super);
    function FontParserTTF(byteData) {
        var _this = _super.call(this) || this;
        _this.cff2 = null;
        _this.init(byteData);
        return _this;
    }
    // Static load method that returns a Promise
    FontParserTTF.load = function (url) {
        return fetch(url)
            .then(function (response) {
            if (!response.ok)
                throw new Error("HTTP error! Status: ".concat(response.status));
            return response.arrayBuffer();
        })
            .then(function (arrayBuffer) { return new ByteArray(new Uint8Array(arrayBuffer)); }) // Wrap in ByteArray
            .then(function (byteArray) { return new FontParserTTF(byteArray); }) // Create and initialize FontParserTTF
            .catch(function (error) {
            console.error('Error loading font:', error);
            throw error; // Propagate error for further handling if needed
        });
    };
    // Initialize the FontParserTTF instance
    FontParserTTF.prototype.init = function (byteData) {
        this.parseSfntTables(byteData);
        this.wireCommonTables();
        this.cff2 = this.getTable(Table.CFF2);
    };
    // Get a glyph description by index
    FontParserTTF.prototype.getGlyph = function (i) {
        var _a, _b;
        return this.getGlyphShared(i, {
            maxGlyphs: (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : null,
            glyf: this.glyf,
            hmtx: this.hmtx,
            gvar: this.gvar,
            variationCoords: this.variationCoords,
            cff: this.cff,
            cff2: this.cff2,
            cffIncludePhantoms: false
        });
    };
    FontParserTTF.prototype.applyIupDeltas = function (base, dx, dy, touched) {
        this.applyIupDeltasShared(base, dx, dy, touched);
    };
    FontParserTTF.prototype.interpolate = function (aCoord, bCoord, aDelta, bDelta, pCoord) {
        return this.interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord);
    };
    FontParserTTF.prototype.onVariationCoordsUpdated = function (coords) {
        if (this.cff2)
            this.cff2.setVariationCoords(coords);
        _super.prototype.onVariationCoordsUpdated.call(this, coords);
    };
    return FontParserTTF;
}(BaseFontParser));
export { FontParserTTF };
