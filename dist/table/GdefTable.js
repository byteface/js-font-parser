import { Table } from "./Table.js";
import { ClassDefReader } from "./ClassDefReader.js";
import { Coverage } from "./Coverage.js";
var GdefTable = /** @class */ (function () {
    function GdefTable(de, byte_ar) {
        this.glyphClassDef = null;
        this.markAttachClassDef = null;
        this.markGlyphSets = [];
        var start = de.offset;
        byte_ar.offset = start;
        var major = byte_ar.readUnsignedShort();
        var minor = byte_ar.readUnsignedShort();
        if (major !== 1)
            return;
        var glyphClassDefOffset = byte_ar.readUnsignedShort();
        byte_ar.readUnsignedShort(); // attachListOffset
        byte_ar.readUnsignedShort(); // ligCaretListOffset
        var markAttachClassDefOffset = byte_ar.readUnsignedShort();
        var markGlyphSetsDefOffset = 0;
        if (major > 1 || minor >= 2) {
            markGlyphSetsDefOffset = byte_ar.readUnsignedShort();
            if (minor >= 3) {
                byte_ar.readUnsignedInt(); // itemVarStoreOffset
            }
        }
        if (glyphClassDefOffset) {
            byte_ar.offset = start + glyphClassDefOffset;
            this.glyphClassDef = ClassDefReader.read(byte_ar);
        }
        if (markAttachClassDefOffset) {
            byte_ar.offset = start + markAttachClassDefOffset;
            this.markAttachClassDef = ClassDefReader.read(byte_ar);
        }
        if (markGlyphSetsDefOffset) {
            byte_ar.offset = start + markGlyphSetsDefOffset;
            var format = byte_ar.readUnsignedShort();
            if (format === 1) {
                var count = byte_ar.readUnsignedShort();
                var offsets = [];
                for (var i = 0; i < count; i++)
                    offsets.push(byte_ar.readUnsignedShort());
                this.markGlyphSets = offsets
                    .map(function (off) {
                    byte_ar.offset = start + markGlyphSetsDefOffset + off;
                    return Coverage.read(byte_ar);
                })
                    .filter(function (c) { return !!c; });
            }
        }
    }
    GdefTable.prototype.getType = function () {
        return Table.GDEF;
    };
    GdefTable.prototype.getGlyphClass = function (glyphId) {
        var _a, _b;
        return (_b = (_a = this.glyphClassDef) === null || _a === void 0 ? void 0 : _a.getGlyphClass(glyphId)) !== null && _b !== void 0 ? _b : 0;
    };
    GdefTable.prototype.getMarkAttachmentClass = function (glyphId) {
        var _a, _b;
        return (_b = (_a = this.markAttachClassDef) === null || _a === void 0 ? void 0 : _a.getGlyphClass(glyphId)) !== null && _b !== void 0 ? _b : 0;
    };
    GdefTable.prototype.isGlyphInMarkSet = function (setIndex, glyphId) {
        var coverage = this.markGlyphSets[setIndex];
        if (!coverage)
            return false;
        return coverage.findGlyph(glyphId) >= 0;
    };
    return GdefTable;
}());
export { GdefTable };
