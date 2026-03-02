import { ByteArray } from '../utils/ByteArray.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
var FontParserTTF = /** @class */ (function () {
    function FontParserTTF(byteData) {
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
        this.gsub = null;
        this.kern = null;
        this.colr = null;
        this.cpal = null;
        // Table directory and tables
        this.tableDir = null;
        this.tables = [];
        this.init(byteData);
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
    FontParserTTF.prototype.getGlyphIndexByChar = function (char) {
        if (char.length !== 1) {
            console.error("getGlyphIndexByChar expects a single character");
            return null;
        }
        var codePoint = char.codePointAt(0); // Convert character to Unicode code point
        if (codePoint == null) {
            console.error("Failed to get code point for character");
            return null;
        }
        if (!this.cmap) {
            console.warn("No cmap table available");
            return null;
        }
        var cmapFormat = this.getBestCmapFormat();
        if (!cmapFormat) {
            console.warn("No cmap format available");
            return null;
        }
        var glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);
        if (glyphIndex == null || glyphIndex === 0) {
            console.warn("No glyph found for code point: ".concat(codePoint));
            return null;
        }
        return glyphIndex;
    };
    FontParserTTF.prototype.getGlyphByChar = function (char) {
        var glyphIndex = this.getGlyphIndexByChar(char);
        if (glyphIndex == null)
            return null;
        return this.getGlyph(glyphIndex);
    };
    FontParserTTF.prototype.getGlyphIndicesForString = function (text) {
        var indices = [];
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            var idx = this.getGlyphIndexByChar(ch);
            if (idx != null)
                indices.push(idx);
        }
        return indices;
    };
    FontParserTTF.prototype.getGlyphIndicesForStringWithGsub = function (text, featureTags) {
        if (featureTags === void 0) { featureTags = ["liga"]; }
        var glyphs = this.getGlyphIndicesForString(text);
        if (!this.gsub || glyphs.length === 0)
            return glyphs;
        var subtables = this.gsub.getSubtablesForFeatures(featureTags);
        var result = glyphs.slice();
        var _loop_1 = function (st) {
            if (!st)
                return "continue";
            if (typeof st.substitute === "function") {
                result = result.map(function (g) { return st.substitute(g); });
                return "continue";
            }
            if (st instanceof LigatureSubstFormat1) {
                var lig = st;
                var next = [];
                var i = 0;
                while (i < result.length) {
                    var match = lig.tryLigature(result, i);
                    if (match) {
                        next.push(match.glyphId);
                        i += match.length;
                    }
                    else {
                        next.push(result[i]);
                        i += 1;
                    }
                }
                result = next;
            }
        };
        for (var _i = 0, subtables_1 = subtables; _i < subtables_1.length; _i++) {
            var st = subtables_1[_i];
            _loop_1(st);
        }
        return result;
    };
    FontParserTTF.prototype.getKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var _a;
        if (!this.kern)
            return 0;
        if (typeof this.kern.getKerningValue === "function") {
            return (_a = this.kern.getKerningValue(leftGlyph, rightGlyph)) !== null && _a !== void 0 ? _a : 0;
        }
        return 0;
    };
    FontParserTTF.prototype.getKerningValue = function (leftChar, rightChar) {
        var left = this.getGlyphIndexByChar(leftChar);
        var right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null)
            return 0;
        return this.getKerningValueByGlyphs(left, right);
    };
    FontParserTTF.prototype.layoutString = function (text, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var gsubFeatures = (_a = options.gsubFeatures) !== null && _a !== void 0 ? _a : ["liga"];
        var glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures);
        var positioned = [];
        for (var i = 0; i < glyphIndices.length; i++) {
            var glyphIndex = glyphIndices[i];
            var glyph = this.getGlyph(glyphIndex);
            if (!glyph)
                continue;
            var kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
            }
            positioned.push({
                glyphIndex: glyphIndex,
                xAdvance: glyph.advanceWidth + kern,
                xOffset: 0,
            });
        }
        return positioned;
    };
    // Get a glyph description by index
    FontParserTTF.prototype.getGlyph = function (i) {
        var _a, _b, _c, _d, _e;
        var description = (_a = this.glyf) === null || _a === void 0 ? void 0 : _a.getDescription(i);
        return description != null
            ? new GlyphData(description, (_c = (_b = this.hmtx) === null || _b === void 0 ? void 0 : _b.getLeftSideBearing(i)) !== null && _c !== void 0 ? _c : 0, (_e = (_d = this.hmtx) === null || _d === void 0 ? void 0 : _d.getAdvanceWidth(i)) !== null && _e !== void 0 ? _e : 0)
            : null;
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
    FontParserTTF.prototype.getColorLayersForGlyph = function (glyphId, paletteIndex) {
        var _a, _b;
        if (paletteIndex === void 0) { paletteIndex = 0; }
        if (!this.colr)
            return [];
        var layers = this.colr.getLayersForGlyph(glyphId);
        if (layers.length === 0)
            return [];
        var palette = (_b = (_a = this.cpal) === null || _a === void 0 ? void 0 : _a.getPalette(paletteIndex)) !== null && _b !== void 0 ? _b : [];
        return layers.map(function (layer) {
            if (layer.paletteIndex === 0xffff) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            var color = palette[layer.paletteIndex];
            if (!color) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            var rgba = "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat(color.alpha / 255, ")");
            return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
        });
    };
    FontParserTTF.prototype.getColorLayersForChar = function (char, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    };
    FontParserTTF.prototype.getNameRecord = function (nameId) {
        var _a, _b;
        return (_b = (_a = this.pName) === null || _a === void 0 ? void 0 : _a.getRecord(nameId)) !== null && _b !== void 0 ? _b : "";
    };
    FontParserTTF.prototype.getAllNameRecords = function () {
        if (!this.pName)
            return [];
        return this.pName.records.map(function (r) { return ({ nameId: r.nameId, record: r.record }); });
    };
    FontParserTTF.prototype.getTableByType = function (tableType) {
        return this.getTable(tableType);
    };
    // Return a table by type
    FontParserTTF.prototype.getTable = function (tableType) {
        return this.tables.find(function (tab) { return (tab === null || tab === void 0 ? void 0 : tab.getType()) === tableType; }) || null;
    };
    FontParserTTF.prototype.getBestCmapFormat = function () {
        if (!this.cmap)
            return null;
        var preferred = [
            { platformId: 3, encodingId: 1 }, // Windows, Unicode BMP
            { platformId: 3, encodingId: 10 }, // Windows, UCS-4
            { platformId: 0, encodingId: 4 }, // Unicode, UCS-4
            { platformId: 0, encodingId: 3 }, // Unicode, BMP
            { platformId: 0, encodingId: 1 }, // Unicode, 1.1
            { platformId: 1, encodingId: 0 }, // Macintosh, Roman
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
    FontParserTTF.prototype.pickBestFormat = function (formats) {
        if (formats.length === 0)
            return null;
        var order = [4, 12, 10, 8, 6, 2, 0];
        var _loop_2 = function (fmt) {
            var found = formats.find(function (f) { return (typeof f.getFormatType === "function" ? f.getFormatType() : f.format) === fmt; });
            if (found)
                return { value: found };
        };
        for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
            var fmt = order_1[_i];
            var state_1 = _loop_2(fmt);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return formats[0];
    };
    return FontParserTTF;
}());
export { FontParserTTF };
