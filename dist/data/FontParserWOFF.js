import { ByteArray } from '../utils/ByteArray.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
var FontParserWOFF = /** @class */ (function () {
    function FontParserWOFF(byteData) {
        // Define properties
        this.os2 = null;
        this.cmap = null;
        this.glyf = null;
        this.head = null;
        this.hhea = null;
        this.hmtx = null;
        this.loca = null;
        this.maxp = null;
        this.pName = null;
        this.post = null;
        // Table directory and tables
        this.tableDir = null;
        this.tables = [];
        this.init(byteData);
    }
    // Initialize the FontParserWOFF instance
    FontParserWOFF.prototype.init = function (byteData) {
        // Read the WOFF header
        var woffVersion = byteData.readUInt(); // 4 bytes
        var woffSize = byteData.readUInt(); // 4 bytes
        var woffNumTables = byteData.readUnsignedShort(); // 2 bytes
        var woffReserved = byteData.readUnsignedShort(); // 2 bytes
        var woffTotalSfntSize = byteData.readUInt(); // 4 bytes
        var woffMajorVersion = byteData.readUnsignedShort(); // 2 bytes
        var woffMinorVersion = byteData.readUnsignedShort(); // 2 bytes
        var woffMetaOffset = byteData.readUInt(); // 4 bytes
        var woffMetaLength = byteData.readUInt(); // 4 bytes
        var woffMetadata = byteData.readUInt(); // 4 bytes
        // Initialize the table directory
        this.tables = [];
        var offset = 0;
        // Read each table
        for (var i = 0; i < woffNumTables; i++) {
            var tag = byteData.readUInt(); // 4 bytes
            var offsetTable = byteData.readUInt(); // 4 bytes
            var lengthTable = byteData.readUInt(); // 4 bytes
            var checksumTable = byteData.readUInt(); // 4 bytes
            // Store table information for later extraction
            this.tables.push({ tag: tag, offset: offsetTable, length: lengthTable });
        }
        // Extract and parse the underlying TTF data
        // (Assuming tables are in a contiguous block after the WOFF header)
        // const ttfData = byteData.subarray(woffNumTables * 12 + 44); // Calculate the TTF data position
        // Assuming byteData is an instance of ByteArray, convert it to Uint8Array
        var ttfData = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength).subarray(woffNumTables * 12 + 44);
        this.parseTTF(new ByteArray(ttfData));
    };
    FontParserWOFF.prototype.parseTTF = function (byteData) {
        var _a, _b, _c, _d;
        // Load TTF tables from the extracted byte data
        var tf = new TableFactory();
        this.tableDir = new TableDirectory(byteData);
        for (var i = 0; i < this.tableDir.numTables; i++) {
            var tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }
        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.glyf = this.getTable(Table.glyf);
        this.head = this.getTable(Table.head);
        this.hhea = this.getTable(Table.hhea);
        this.hmtx = this.getTable(Table.hmtx);
        this.loca = this.getTable(Table.loca);
        this.maxp = this.getTable(Table.maxp);
        this.pName = this.getTable(Table.pName);
        this.post = this.getTable(Table.post);
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
    // Get a glyph description by index
    FontParserWOFF.prototype.getGlyph = function (i) {
        var _a, _b, _c, _d, _e;
        var description = (_a = this.glyf) === null || _a === void 0 ? void 0 : _a.getDescription(i);
        return description != null
            ? new GlyphData(description, (_c = (_b = this.hmtx) === null || _b === void 0 ? void 0 : _b.getLeftSideBearing(i)) !== null && _c !== void 0 ? _c : 0, (_e = (_d = this.hmtx) === null || _d === void 0 ? void 0 : _d.getAdvanceWidth(i)) !== null && _e !== void 0 ? _e : 0)
            : null;
    };
    // Get the number of glyphs
    FontParserWOFF.prototype.getNumGlyphs = function () {
        var _a, _b;
        return (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the ascent value
    FontParserWOFF.prototype.getAscent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.ascender) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the descent value
    FontParserWOFF.prototype.getDescent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.descender) !== null && _b !== void 0 ? _b : 0;
    };
    FontParserWOFF.prototype.getGlyphIndexByChar = function (char) {
        if (char.length !== 1) {
            console.error("getGlyphIndexByChar expects a single character");
            return null;
        }
        var codePoint = char.codePointAt(0);
        if (codePoint == null)
            return null;
        if (!this.cmap)
            return null;
        var cmapFormat = this.getBestCmapFormat();
        if (!cmapFormat)
            return null;
        var glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);
        if (glyphIndex == null || glyphIndex === 0)
            return null;
        return glyphIndex;
    };
    FontParserWOFF.prototype.getGlyphByChar = function (char) {
        var idx = this.getGlyphIndexByChar(char);
        if (idx == null)
            return null;
        return this.getGlyph(idx);
    };
    // Return a table by type
    FontParserWOFF.prototype.getTable = function (tableType) {
        return this.tables.find(function (tab) { return (tab === null || tab === void 0 ? void 0 : tab.getType()) === tableType; }) || null;
    };
    FontParserWOFF.prototype.getBestCmapFormat = function () {
        if (!this.cmap)
            return null;
        var preferred = [
            { platformId: 3, encodingId: 1 },
            { platformId: 3, encodingId: 10 },
            { platformId: 0, encodingId: 4 },
            { platformId: 0, encodingId: 3 },
            { platformId: 0, encodingId: 1 },
            { platformId: 1, encodingId: 0 }
        ];
        for (var _i = 0, preferred_1 = preferred; _i < preferred_1.length; _i++) {
            var pref = preferred_1[_i];
            var formats = this.cmap.getCmapFormats(pref.platformId, pref.encodingId);
            if (formats.length > 0) {
                return this.pickBestFormat(formats);
            }
        }
        return this.cmap.formats.length > 0 ? this.pickBestFormat(this.cmap.formats) : null;
    };
    FontParserWOFF.prototype.pickBestFormat = function (formats) {
        if (formats.length === 0)
            return null;
        var order = [4, 12, 10, 8, 6, 2, 0];
        for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
            var fmt = order_1[_i];
            var found = formats.find(function (f) { return (typeof f.getFormatType === "function" ? f.getFormatType() : f.format) === fmt; });
            if (found)
                return found;
        }
        return formats[0];
    };
    return FontParserWOFF;
}());
export { FontParserWOFF };
