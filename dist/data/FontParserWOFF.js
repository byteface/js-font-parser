var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { GlyphData } from './GlyphData.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
var FontParserWOFF = /** @class */ (function () {
    function FontParserWOFF(byteData, options) {
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
        if ((options === null || options === void 0 ? void 0 : options.format) === 'sfnt') {
            this.parseTTF(byteData);
        }
        else {
            this.init(byteData);
        }
    }
    FontParserWOFF.load = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var response, buffer, sfnt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(url)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("HTTP error! Status: ".concat(response.status));
                        return [4 /*yield*/, response.arrayBuffer()];
                    case 2:
                        buffer = _a.sent();
                        return [4 /*yield*/, this.decodeWoffToSfnt(buffer)];
                    case 3:
                        sfnt = _a.sent();
                        return [2 /*return*/, new FontParserWOFF(new ByteArray(sfnt), { format: 'sfnt' })];
                }
            });
        });
    };
    // Initialize the FontParserWOFF instance (legacy sync path; expects uncompressed WOFF)
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
        // Legacy path assumes uncompressed WOFF with contiguous tables (not generally safe).
        // Prefer FontParserWOFF.load which rebuilds an sfnt buffer with decompression support.
        var ttfData = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength);
        this.parseTTF(new ByteArray(ttfData));
    };
    FontParserWOFF.readUint32 = function (view, offset) {
        return view.getUint32(offset, false);
    };
    FontParserWOFF.readUint16 = function (view, offset) {
        return view.getUint16(offset, false);
    };
    FontParserWOFF.inflate = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, response, decompressed, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof DecompressionStream === 'undefined') {
                            throw new Error('WOFF decompression requires DecompressionStream (not available).');
                        }
                        stream = new DecompressionStream('deflate');
                        response = new Response(data).body;
                        if (!response)
                            throw new Error('Failed to create response body for decompression.');
                        decompressed = response.pipeThrough(stream);
                        return [4 /*yield*/, new Response(decompressed).arrayBuffer()];
                    case 1:
                        buffer = _a.sent();
                        return [2 /*return*/, new Uint8Array(buffer)];
                }
            });
        });
    };
    FontParserWOFF.decodeWoffToSfnt = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var view, signature, flavor, length, numTables, totalSfntSize, tableDirOffset, entries, i, offset, maxPower, searchRange, entrySelector, rangeShift, sfntBuffer, sfntView, dataOffset, tableRecords, _i, entries_1, entry, aligned, tableData, decoded, target;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        view = new DataView(buffer);
                        signature = this.readUint32(view, 0);
                        if (signature !== 0x774f4646) {
                            throw new Error('Not a valid WOFF file.');
                        }
                        flavor = this.readUint32(view, 4);
                        length = this.readUint32(view, 8);
                        numTables = this.readUint16(view, 12);
                        totalSfntSize = this.readUint32(view, 16);
                        tableDirOffset = 44;
                        entries = [];
                        for (i = 0; i < numTables; i++) {
                            offset = tableDirOffset + i * 20;
                            entries.push({
                                tag: this.readUint32(view, offset),
                                offset: this.readUint32(view, offset + 4),
                                compLength: this.readUint32(view, offset + 8),
                                origLength: this.readUint32(view, offset + 12),
                                checksum: this.readUint32(view, offset + 16)
                            });
                        }
                        entries.sort(function (a, b) { return a.tag - b.tag; });
                        maxPower = Math.pow(2, Math.floor(Math.log2(numTables)));
                        searchRange = maxPower * 16;
                        entrySelector = Math.log2(maxPower);
                        rangeShift = numTables * 16 - searchRange;
                        sfntBuffer = new ArrayBuffer(totalSfntSize);
                        sfntView = new DataView(sfntBuffer);
                        sfntView.setUint32(0, flavor, false);
                        sfntView.setUint16(4, numTables, false);
                        sfntView.setUint16(6, searchRange, false);
                        sfntView.setUint16(8, entrySelector, false);
                        sfntView.setUint16(10, rangeShift, false);
                        dataOffset = 12 + numTables * 16;
                        tableRecords = [];
                        _i = 0, entries_1 = entries;
                        _a.label = 1;
                    case 1:
                        if (!(_i < entries_1.length)) return [3 /*break*/, 5];
                        entry = entries_1[_i];
                        aligned = (dataOffset + 3) & ~3;
                        dataOffset = aligned;
                        tableRecords.push(__assign(__assign({}, entry), { sfntOffset: dataOffset }));
                        tableData = new Uint8Array(buffer, entry.offset, entry.compLength);
                        decoded = tableData;
                        if (!(entry.compLength < entry.origLength)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.inflate(tableData)];
                    case 2:
                        decoded = _a.sent();
                        _a.label = 3;
                    case 3:
                        target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
                        target.set(decoded.subarray(0, entry.origLength));
                        dataOffset += entry.origLength;
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        tableRecords.forEach(function (record, i) {
                            var base = 12 + i * 16;
                            sfntView.setUint32(base, record.tag, false);
                            sfntView.setUint32(base + 4, record.checksum, false);
                            sfntView.setUint32(base + 8, record.sfntOffset, false);
                            sfntView.setUint32(base + 12, record.origLength, false);
                        });
                        return [2 /*return*/, new Uint8Array(sfntBuffer)];
                }
            });
        });
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
    FontParserWOFF.prototype.getColorLayersForGlyph = function (glyphId, paletteIndex) {
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
    FontParserWOFF.prototype.getColorLayersForChar = function (char, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    };
    FontParserWOFF.prototype.getGlyphIndexByChar = function (char) {
        if (!char || char.length === 0) {
            console.error("getGlyphIndexByChar expects a character");
            return null;
        }
        if (char.length > 2) {
            console.warn("getGlyphIndexByChar received multiple characters; using the first code point");
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
    FontParserWOFF.prototype.getGlyphIndicesForStringWithGsub = function (text, featureTags) {
        if (featureTags === void 0) { featureTags = ["liga"]; }
        var glyphs = [];
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            var idx = this.getGlyphIndexByChar(ch);
            if (idx != null)
                glyphs.push(idx);
        }
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
        for (var _a = 0, subtables_1 = subtables; _a < subtables_1.length; _a++) {
            var st = subtables_1[_a];
            _loop_1(st);
        }
        return result;
    };
    FontParserWOFF.prototype.getKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var _a;
        if (!this.kern)
            return 0;
        if (typeof this.kern.getKerningValue === "function") {
            return (_a = this.kern.getKerningValue(leftGlyph, rightGlyph)) !== null && _a !== void 0 ? _a : 0;
        }
        return 0;
    };
    FontParserWOFF.prototype.layoutString = function (text, options) {
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
    FontParserWOFF.prototype.getTableByType = function (tableType) {
        return this.getTable(tableType);
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
    return FontParserWOFF;
}());
export { FontParserWOFF };
