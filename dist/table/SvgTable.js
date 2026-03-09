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
import { Table } from './Table.js';
var SvgTable = /** @class */ (function () {
    function SvgTable(de, byteArray) {
        this.version = 0;
        this.svgDocIndexOffset = 0;
        this.entries = [];
        var start = de.offset;
        this.startOffset = start;
        this.view = byteArray.dataView;
        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        this.svgDocIndexOffset = byteArray.readUnsignedInt();
        byteArray.readUnsignedInt(); // reserved
        if (this.svgDocIndexOffset === 0)
            return;
        var indexOffset = start + this.svgDocIndexOffset;
        var numEntries = this.view.getUint16(indexOffset, false);
        this.entries = [];
        var cursor = indexOffset + 2;
        for (var i = 0; i < numEntries; i++) {
            var startGlyphId = this.view.getUint16(cursor, false);
            var endGlyphId = this.view.getUint16(cursor + 2, false);
            var svgDocOffset = this.view.getUint32(cursor + 4, false);
            var svgDocLength = this.view.getUint32(cursor + 8, false);
            this.entries.push({ startGlyphId: startGlyphId, endGlyphId: endGlyphId, svgDocOffset: svgDocOffset, svgDocLength: svgDocLength });
            cursor += 12;
        }
    }
    SvgTable.prototype.getSvgDocumentForGlyph = function (glyphId) {
        var entry = this.entries.find(function (e) { return glyphId >= e.startGlyphId && glyphId <= e.endGlyphId; });
        if (!entry)
            return { svgText: null, isCompressed: false };
        var docStart = this.startOffset + this.svgDocIndexOffset + entry.svgDocOffset;
        var bytes = new Uint8Array(this.view.buffer, docStart, entry.svgDocLength);
        var isCompressed = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
        if (isCompressed) {
            return { svgText: null, isCompressed: true };
        }
        var decoder = new TextDecoder('utf-8');
        return { svgText: decoder.decode(bytes), isCompressed: false };
    };
    SvgTable.prototype.getSvgDocumentForGlyphAsync = function (glyphId) {
        return __awaiter(this, void 0, void 0, function () {
            var base, entry, docStart, bytes, stream, payload, response, decompressed, buffer, decoder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        base = this.getSvgDocumentForGlyph(glyphId);
                        if (!base.isCompressed)
                            return [2 /*return*/, base];
                        if (typeof DecompressionStream === 'undefined') {
                            return [2 /*return*/, { svgText: null, isCompressed: true }];
                        }
                        entry = this.entries.find(function (e) { return glyphId >= e.startGlyphId && glyphId <= e.endGlyphId; });
                        if (!entry)
                            return [2 /*return*/, { svgText: null, isCompressed: false }];
                        docStart = this.startOffset + this.svgDocIndexOffset + entry.svgDocOffset;
                        bytes = new Uint8Array(this.view.buffer, docStart, entry.svgDocLength);
                        stream = new DecompressionStream('gzip');
                        payload = new Uint8Array(bytes);
                        response = new Response(payload).body;
                        if (!response)
                            return [2 /*return*/, { svgText: null, isCompressed: true }];
                        decompressed = response.pipeThrough(stream);
                        return [4 /*yield*/, new Response(decompressed).arrayBuffer()];
                    case 1:
                        buffer = _a.sent();
                        decoder = new TextDecoder('utf-8');
                        return [2 /*return*/, { svgText: decoder.decode(new Uint8Array(buffer)), isCompressed: false }];
                }
            });
        });
    };
    SvgTable.prototype.getType = function () {
        return Table.SVG;
    };
    return SvgTable;
}());
export { SvgTable };
