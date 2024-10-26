// UNTESTED
var Lookup = /** @class */ (function () {
    function Lookup(factory, byte_ar, offset) {
        byte_ar.offset = offset;
        this.type = byte_ar.readUnsignedShort();
        this.flag = byte_ar.readUnsignedShort();
        this.subTableCount = byte_ar.readUnsignedShort();
        this.subTableOffsets = new Array(this.subTableCount);
        this.subTables = new Array(this.subTableCount);
        for (var i = 0; i < this.subTableCount; i++) {
            this.subTableOffsets[i] = byte_ar.readUnsignedShort();
        }
        for (var j = 0; j < this.subTableCount; j++) {
            this.subTables[j] = factory.read(this.type, byte_ar, offset + this.subTableOffsets[j]);
        }
    }
    Lookup.prototype.getType = function () {
        return this.type;
    };
    Lookup.prototype.getSubtableCount = function () {
        return this.subTableCount;
    };
    Lookup.prototype.getSubtable = function (i) {
        return this.subTables[i];
    };
    // LookupFlag bit enumeration
    Lookup.IGNORE_BASE_GLYPHS = 0x0002;
    Lookup.IGNORE_BASE_LIGATURES = 0x0004;
    Lookup.IGNORE_BASE_MARKS = 0x0008;
    Lookup.MARK_ATTACHMENT_TYPE = 0xFF00;
    return Lookup;
}());
export { Lookup };
