var CmapFormat0 = /** @class */ (function () {
    function CmapFormat0(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 0;
        this.first = -1;
        this.last = -1; // Initialize last to -1
        this.glyphIdArray = new Array(256); // Initialize the array
        for (var i = 0; i < 256; i++) {
            this.glyphIdArray[i] = byteArray.readByte();
            if (this.glyphIdArray[i] > 0) {
                if (this.first === -1)
                    this.first = i;
                this.last = i;
            }
        }
    }
    CmapFormat0.prototype.getFirst = function () {
        return this.first;
    };
    CmapFormat0.prototype.getLast = function () {
        return this.last;
    };
    CmapFormat0.prototype.mapCharCode = function (charCode) {
        if (0 <= charCode && charCode < 256) {
            return this.glyphIdArray[charCode];
        }
        else {
            return 0;
        }
    };
    // Method to get the format type (always returns 0 for CmapFormat0)
    CmapFormat0.prototype.getFormatType = function () {
        return this.format;
    };
    // Method to get the glyph index for a given code point
    CmapFormat0.prototype.getGlyphIndex = function (codePoint) {
        if (codePoint >= 0 && codePoint < this.glyphIdArray.length) {
            return this.glyphIdArray[codePoint];
        }
        return null;
    };
    CmapFormat0.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version);
    };
    return CmapFormat0;
}());
export { CmapFormat0 };
