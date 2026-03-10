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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { ByteArray } from '../utils/ByteArray.js';
import { BaseFontParser } from './BaseFontParser.js';
var FontParserWOFF = /** @class */ (function (_super) {
    __extends(FontParserWOFF, _super);
    function FontParserWOFF(byteData, options) {
        var _this = _super.call(this) || this;
        if ((options === null || options === void 0 ? void 0 : options.format) === 'sfnt') {
            _this.parseTTF(byteData);
        }
        else {
            _this.init(byteData);
        }
        return _this;
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
    // Initialize from raw WOFF bytes. This sync path supports only stored (uncompressed)
    // table payloads; compressed WOFF should use FontParserWOFF.load().
    FontParserWOFF.prototype.init = function (byteData) {
        var _a;
        var rawBytes = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength);
        try {
            var sfnt = FontParserWOFF.decodeWoffToSfntSync(rawBytes);
            this.parseTTF(new ByteArray(sfnt));
            return;
        }
        catch (error) {
            var message = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "";
            if (!/Compressed WOFF table detected/i.test(message)) {
                throw error;
            }
            // Compatibility fallback: retain legacy behavior for compressed WOFF
            // in sync call sites (FontParser.fromArrayBuffer).
            this.parseTTF(new ByteArray(rawBytes));
        }
    };
    FontParserWOFF.readUint32 = function (view, offset) {
        return view.getUint32(offset, false);
    };
    FontParserWOFF.readUint16 = function (view, offset) {
        return view.getUint16(offset, false);
    };
    FontParserWOFF.assertNonOverlappingTableRanges = function (entries) {
        var byOffset = __spreadArray([], entries, true).sort(function (a, b) { return a.offset - b.offset; });
        for (var i = 1; i < byOffset.length; i++) {
            var prev = byOffset[i - 1];
            var curr = byOffset[i];
            var prevEnd = prev.offset + prev.compLength;
            if (curr.offset < prevEnd) {
                throw new Error('Invalid WOFF table entry: overlapping table data ranges.');
            }
        }
    };
    FontParserWOFF.decodeWoffToSfntSync = function (buffer) {
        var view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        if (view.byteLength < 44) {
            throw new Error('Invalid WOFF input: too short.');
        }
        var signature = this.readUint32(view, 0);
        if (signature !== this.WOFF_SIGNATURE) {
            throw new Error('Not a valid WOFF file.');
        }
        var flavor = this.readUint32(view, 4);
        var declaredLength = this.readUint32(view, 8);
        var numTables = this.readUint16(view, 12);
        var totalSfntSize = this.readUint32(view, 16);
        if (declaredLength !== view.byteLength) {
            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
        }
        if (numTables <= 0) {
            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
        }
        var tableDirOffset = 44;
        if (tableDirOffset + numTables * 20 > view.byteLength) {
            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
        }
        var entries = [];
        for (var i = 0; i < numTables; i++) {
            var offset = tableDirOffset + i * 20;
            var entry = {
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            };
            if (entry.offset > view.byteLength || entry.compLength > view.byteLength - entry.offset) {
                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
            }
            if (entry.compLength !== entry.origLength) {
                throw new Error('Compressed WOFF table detected in sync path. Use FontParserWOFF.load() for decompression support.');
            }
            entries.push(entry);
        }
        this.assertNonOverlappingTableRanges(entries);
        entries.sort(function (a, b) { return a.tag - b.tag; });
        var maxPower = Math.pow(2, Math.floor(Math.log2(numTables)));
        var searchRange = maxPower * 16;
        var entrySelector = Math.log2(maxPower);
        var rangeShift = numTables * 16 - searchRange;
        if (totalSfntSize < 12 + numTables * 16) {
            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
        }
        var sfntBuffer = new ArrayBuffer(totalSfntSize);
        var sfntView = new DataView(sfntBuffer);
        sfntView.setUint32(0, flavor, false);
        sfntView.setUint16(4, numTables, false);
        sfntView.setUint16(6, searchRange, false);
        sfntView.setUint16(8, entrySelector, false);
        sfntView.setUint16(10, rangeShift, false);
        var dataOffset = 12 + numTables * 16;
        var tableRecords = [];
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            dataOffset = (dataOffset + 3) & ~3;
            tableRecords.push(__assign(__assign({}, entry), { sfntOffset: dataOffset }));
            if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
            }
            var source = new Uint8Array(buffer.buffer, buffer.byteOffset + entry.offset, entry.origLength);
            var target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
            target.set(source);
            dataOffset += entry.origLength;
        }
        tableRecords.forEach(function (record, i) {
            var base = 12 + i * 16;
            sfntView.setUint32(base, record.tag, false);
            sfntView.setUint32(base + 4, record.checksum, false);
            sfntView.setUint32(base + 8, record.sfntOffset, false);
            sfntView.setUint32(base + 12, record.origLength, false);
        });
        return new Uint8Array(sfntBuffer);
    };
    FontParserWOFF.inflate = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, payload, response, decompressed, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof DecompressionStream === 'undefined') {
                            throw new Error('WOFF decompression requires DecompressionStream (not available).');
                        }
                        stream = new DecompressionStream('deflate');
                        payload = new Uint8Array(data);
                        response = new Response(payload).body;
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
            var view, signature, flavor, length, numTables, totalSfntSize, tableDirOffset, entries, i, offset, entry, maxPower, searchRange, entrySelector, rangeShift, sfntBuffer, sfntView, dataOffset, tableRecords, _i, entries_2, entry, aligned, tableData, decoded, target;
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
                        if (length !== buffer.byteLength) {
                            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
                        }
                        if (numTables <= 0) {
                            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
                        }
                        tableDirOffset = 44;
                        if (tableDirOffset + numTables * 20 > buffer.byteLength) {
                            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
                        }
                        entries = [];
                        for (i = 0; i < numTables; i++) {
                            offset = tableDirOffset + i * 20;
                            entry = {
                                tag: this.readUint32(view, offset),
                                offset: this.readUint32(view, offset + 4),
                                compLength: this.readUint32(view, offset + 8),
                                origLength: this.readUint32(view, offset + 12),
                                checksum: this.readUint32(view, offset + 16)
                            };
                            if (entry.offset > buffer.byteLength || entry.compLength > buffer.byteLength - entry.offset) {
                                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
                            }
                            if (entry.compLength > entry.origLength) {
                                throw new Error('Invalid WOFF table entry: compLength cannot exceed origLength.');
                            }
                            entries.push(entry);
                        }
                        this.assertNonOverlappingTableRanges(entries);
                        entries.sort(function (a, b) { return a.tag - b.tag; });
                        maxPower = Math.pow(2, Math.floor(Math.log2(numTables)));
                        searchRange = maxPower * 16;
                        entrySelector = Math.log2(maxPower);
                        rangeShift = numTables * 16 - searchRange;
                        if (totalSfntSize < 12 + numTables * 16) {
                            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
                        }
                        sfntBuffer = new ArrayBuffer(totalSfntSize);
                        sfntView = new DataView(sfntBuffer);
                        sfntView.setUint32(0, flavor, false);
                        sfntView.setUint16(4, numTables, false);
                        sfntView.setUint16(6, searchRange, false);
                        sfntView.setUint16(8, entrySelector, false);
                        sfntView.setUint16(10, rangeShift, false);
                        dataOffset = 12 + numTables * 16;
                        tableRecords = [];
                        _i = 0, entries_2 = entries;
                        _a.label = 1;
                    case 1:
                        if (!(_i < entries_2.length)) return [3 /*break*/, 5];
                        entry = entries_2[_i];
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
                        if (decoded.length < entry.origLength) {
                            throw new Error('Invalid WOFF table entry: decompressed data shorter than origLength.');
                        }
                        if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                            throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
                        }
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
        this.parseSfntTables(byteData);
        this.wireCommonTables();
    };
    // Get a glyph description by index
    FontParserWOFF.prototype.getGlyph = function (i) {
        var _a, _b;
        return this.getGlyphShared(i, {
            maxGlyphs: (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : null,
            glyf: this.glyf,
            hmtx: this.hmtx,
            gvar: this.gvar,
            variationCoords: this.variationCoords,
            cff: this.cff,
            cffIncludePhantoms: true
        });
    };
    FontParserWOFF.prototype.applyIupDeltas = function (base, dx, dy, touched) {
        this.applyIupDeltasShared(base, dx, dy, touched);
    };
    FontParserWOFF.prototype.interpolate = function (aCoord, bCoord, aDelta, bDelta, pCoord) {
        return this.interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord);
    };
    FontParserWOFF.WOFF_SIGNATURE = 0x774f4646;
    return FontParserWOFF;
}(BaseFontParser));
export { FontParserWOFF };
