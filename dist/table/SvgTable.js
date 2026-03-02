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
    SvgTable.prototype.getType = function () {
        return Table.SVG;
    };
    return SvgTable;
}());
export { SvgTable };
