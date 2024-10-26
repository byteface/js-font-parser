var CmapFormat8 = /** @class */ (function () {
    function CmapFormat8(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 8;
        // Read the number of character codes
        var numCodes = byteArray.readUnsignedShort();
        this.characterCodes = [];
        this.glyphIdArray = [];
        // Read character codes and corresponding glyph IDs
        for (var i = 0; i < numCodes; i++) {
            this.characterCodes.push(byteArray.readUnsignedShort());
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    CmapFormat8.prototype.getFormatType = function () {
        return this.format; // Return the format type
    };
    CmapFormat8.prototype.getGlyphIndex = function (charCode) {
        // Use binary search or linear search to find the character code
        var index = this.characterCodes.indexOf(charCode);
        return index !== -1 ? this.glyphIdArray[index] : 0; // Return corresponding glyph ID or 0 if not found
    };
    CmapFormat8.prototype.getFirst = function () {
        return this.characterCodes.length > 0 ? this.characterCodes[0] : 0; // Return the first character code
    };
    CmapFormat8.prototype.getLast = function () {
        return this.characterCodes.length > 0 ? this.characterCodes[this.characterCodes.length - 1] : 0; // Return the last character code
    };
    CmapFormat8.prototype.mapCharCode = function (charCode) {
        return this.getGlyphIndex(charCode); // Use getGlyphIndex for mapping
    };
    CmapFormat8.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version, ", ") +
            "characterCodes: ".concat(this.characterCodes, ", glyphIdArray: ").concat(this.glyphIdArray);
    };
    return CmapFormat8;
}());
export { CmapFormat8 };
