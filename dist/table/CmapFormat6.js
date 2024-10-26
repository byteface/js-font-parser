var CmapFormat6 = /** @class */ (function () {
    function CmapFormat6(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 6;
        this.firstCode = byteArray.readUnsignedShort(); // Read firstCode from the ByteArray
        this.entryCount = byteArray.readUnsignedShort(); // Read entryCount from the ByteArray
        this.glyphIdArray = [];
        // Populate glyphIdArray with the glyph IDs
        for (var i = 0; i < this.entryCount; i++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    CmapFormat6.prototype.getFirst = function () {
        return this.firstCode; // Return the first character code
    };
    CmapFormat6.prototype.getLast = function () {
        // Calculate the last code based on firstCode and entryCount
        return this.firstCode + this.entryCount - 1;
    };
    CmapFormat6.prototype.mapCharCode = function (charCode) {
        // Check if charCode falls within the range of firstCode and lastCode
        if (charCode < this.firstCode || charCode > this.getLast()) {
            return 0; // Out of bounds
        }
        // Calculate index in glyphIdArray
        var index = charCode - this.firstCode;
        return this.glyphIdArray[index] || 0; // Return glyph ID or 0 if not found
    };
    CmapFormat6.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version, ", ") +
            "firstCode: ".concat(this.firstCode, ", entryCount: ").concat(this.entryCount, ", ") +
            "glyphIdArray: ".concat(this.glyphIdArray);
    };
    return CmapFormat6;
}());
export { CmapFormat6 };
