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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ByteArray } from '../utils/ByteArray.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { BaseFontParser } from './BaseFontParser.js';
var FontParserTTF = /** @class */ (function (_super) {
    __extends(FontParserTTF, _super);
    function FontParserTTF(byteData) {
        var _this = _super.call(this) || this;
        // Define properties
        _this.os2 = null;
        _this.cmap = null;
        _this.glyf = null;
        _this.cff = null;
        _this.cff2 = null;
        _this.head = null;
        _this.hhea = null;
        _this.hmtx = null;
        _this.loca = null;
        _this.maxp = null;
        _this.pName = null;
        _this.post = null;
        _this.gsub = null;
        _this.kern = null;
        _this.colr = null;
        _this.cpal = null;
        _this.gpos = null;
        _this.gdef = null;
        _this.fvar = null;
        _this.svg = null;
        _this.gvar = null;
        _this.variationCoords = [];
        // Table directory and tables
        _this.tableDir = null;
        _this.tables = [];
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
        var _a, _b, _c, _d;
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];
        // Load each of the tables
        for (var i = 0; i < this.tableDir.numTables; i++) {
            var tf = new TableFactory();
            var tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }
        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.glyf = this.getTable(Table.glyf);
        this.cff = this.getTable(Table.CFF);
        this.cff2 = this.getTable(Table.CFF2);
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
        var maybeGsubWithGdef = this.gsub;
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        this.fvar = this.getTable(Table.fvar);
        this.svg = this.getTable(Table.SVG);
        this.gvar = this.getTable(Table.gvar);
        if (this.fvar && this.fvar.axes.length > 0) {
            var defaults = {};
            for (var _i = 0, _e = this.fvar.axes; _i < _e.length; _i++) {
                var axis = _e[_i];
                defaults[axis.name] = axis.defaultValue;
            }
            this.setVariationByAxes(defaults);
        }
        // Initialize the tables
        if (this.hmtx && this.maxp) {
            this.hmtx.run((_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.numberOfHMetrics) !== null && _b !== void 0 ? _b : 0, this.maxp.numGlyphs - ((_d = (_c = this.hhea) === null || _c === void 0 ? void 0 : _c.numberOfHMetrics) !== null && _d !== void 0 ? _d : 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    };
    /**
     * Apply GPOS value and attachment adjustments to an already-shaped run.
     * Attachment positioning runs after value positioning so mark anchors
     * inherit parent/base offsets introduced earlier in the run.
     */
    FontParserTTF.prototype.applyGposPositioningInternal = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    // Backward-compatible alias used by tests/tools that call this directly.
    FontParserTTF.prototype.applyGposPositioning = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    FontParserTTF.prototype.isMarkGlyphClass = function (glyphId) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.gdef) === null || _a === void 0 ? void 0 : _a.getGlyphClass) === null || _b === void 0 ? void 0 : _b.call(_a, glyphId)) !== null && _c !== void 0 ? _c : 0) === 3;
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
    // Get the number of glyphs
    FontParserTTF.prototype.getNumGlyphs = function () {
        var _a, _b;
        return (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the ascent value
    FontParserTTF.prototype.getAscent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.ascender) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the descent value
    FontParserTTF.prototype.getDescent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.descender) !== null && _b !== void 0 ? _b : 0;
    };
    FontParserTTF.prototype.getUnitsPerEm = function () {
        var _a, _b;
        return (_b = (_a = this.head) === null || _a === void 0 ? void 0 : _a.unitsPerEm) !== null && _b !== void 0 ? _b : 1000;
    };
    FontParserTTF.prototype.getMarkAnchorsForGlyph = function (glyphId, subtables) {
        return this.getGposAttachmentAnchors(glyphId, subtables);
    };
    FontParserTTF.prototype.getSvgDocumentForGlyphAsync = function (glyphId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.svg)
                    return [2 /*return*/, { svgText: null, isCompressed: false }];
                return [2 /*return*/, this.svg.getSvgDocumentForGlyphAsync(glyphId)];
            });
        });
    };
    FontParserTTF.prototype.getTable = function (tableType) {
        return this.tables.find(function (tab) { return (tab === null || tab === void 0 ? void 0 : tab.getType()) === tableType; }) || null;
    };
    FontParserTTF.prototype.getGsubTableForLayout = function () {
        return this.gsub;
    };
    FontParserTTF.prototype.getKernTableForLayout = function () {
        return this.kern;
    };
    FontParserTTF.prototype.getGposTableForLayout = function () {
        return this.gpos;
    };
    FontParserTTF.prototype.getGlyphByIndexForLayout = function (glyphIndex) {
        return this.getGlyph(glyphIndex);
    };
    FontParserTTF.prototype.isMarkGlyphForLayout = function (glyphIndex) {
        return this.isMarkGlyphClass(glyphIndex);
    };
    FontParserTTF.prototype.applyGposPositioningForLayout = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    FontParserTTF.prototype.getTableByTypeInternal = function (tableType) {
        return this.getTable(tableType);
    };
    FontParserTTF.prototype.getNameRecordForInfo = function (nameId) {
        return this.getNameRecord(nameId);
    };
    FontParserTTF.prototype.getOs2TableForInfo = function () {
        return this.os2;
    };
    FontParserTTF.prototype.getPostTableForInfo = function () {
        return this.post;
    };
    FontParserTTF.prototype.getCmapTableForLookup = function () {
        return this.cmap;
    };
    FontParserTTF.prototype.getNameTableForShared = function () {
        return this.pName;
    };
    FontParserTTF.prototype.getOs2TableForShared = function () {
        return this.os2;
    };
    FontParserTTF.prototype.getPostTableForShared = function () {
        return this.post;
    };
    FontParserTTF.prototype.getFvarTableForShared = function () {
        return this.fvar;
    };
    FontParserTTF.prototype.getColrTableForShared = function () {
        return this.colr;
    };
    FontParserTTF.prototype.getCpalTableForShared = function () {
        return this.cpal;
    };
    FontParserTTF.prototype.getUnitsPerEmForShared = function () {
        return this.getUnitsPerEm();
    };
    FontParserTTF.prototype.setVariationCoordsInternal = function (coords) {
        this.variationCoords = coords.slice();
    };
    FontParserTTF.prototype.onVariationCoordsUpdated = function (coords) {
        if (this.cff2)
            this.cff2.setVariationCoords(coords);
        if (this.colr && typeof this.colr.setVariationCoords === 'function') {
            this.colr.setVariationCoords(coords);
        }
    };
    return FontParserTTF;
}(BaseFontParser));
export { FontParserTTF };
