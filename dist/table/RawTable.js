var RawTable = /** @class */ (function () {
    function RawTable(type, de, byte_ar) {
        this.type = type;
        this.offset = de.offset;
        this.length = de.length;
        var prev = byte_ar.offset;
        byte_ar.offset = de.offset;
        this.bytes = byte_ar.readBytes(de.length).slice();
        byte_ar.offset = prev;
    }
    RawTable.prototype.getType = function () {
        return this.type;
    };
    RawTable.prototype.getOffset = function () {
        return this.offset;
    };
    RawTable.prototype.getLength = function () {
        return this.length;
    };
    RawTable.prototype.getBytes = function () {
        return this.bytes.slice();
    };
    return RawTable;
}());
export { RawTable };
