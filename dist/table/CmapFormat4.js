var CmapFormat4 = /** @class */ (function () {
    function CmapFormat4(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.language = 0;
        this.format = 4;
        this.segCountX2 = byteArray.readUnsignedShort();
        this.segCount = this.segCountX2 / 2;
        this.endCode = [];
        this.startCode = [];
        this.idDelta = [];
        this.idRangeOffset = [];
        this.searchRange = byteArray.readUnsignedShort();
        this.entrySelector = byteArray.readUnsignedShort();
        this.rangeShift = byteArray.readUnsignedShort();
        this.last = -1;
        for (var i = 0; i < this.segCount; i++) {
            this.endCode.push(byteArray.readUnsignedShort());
            if (this.endCode[i] > this.last)
                this.last = this.endCode[i];
        }
        byteArray.readUnsignedShort(); // reservePad
        this.first = Number.MAX_SAFE_INTEGER; // Initialize with maximum value
        for (var j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
            if (this.startCode[j] < this.first)
                this.first = this.startCode[j];
        }
        for (var k = 0; k < this.segCount; k++) {
            this.idDelta.push(byteArray.readUnsignedShort());
        }
        for (var l = 0; l < this.segCount; l++) {
            this.idRangeOffset.push(byteArray.readUnsignedShort());
        }
        // Whatever remains of this header belongs in glyphIdArray
        var count = (this.length - 16 - (this.segCount * 8)) / 2;
        this.glyphIdArray = [];
        for (var m = 0; m < count; m++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    CmapFormat4.prototype.getFirst = function () {
        return this.first;
    };
    CmapFormat4.prototype.getLast = function () {
        return this.last;
    };
    CmapFormat4.prototype.mapCharCode = function (charCode) {
        // Handle out-of-bounds
        if (charCode < 0 || charCode >= 0xFFFE)
            return 0;
        for (var i = 0; i < this.segCount; i++) {
            if (this.endCode[i] >= charCode) {
                if (this.startCode[i] <= charCode) {
                    if (this.idRangeOffset[i] > 0) {
                        return this.glyphIdArray[this.idRangeOffset[i] / 2 +
                            (charCode - this.startCode[i]) - (this.segCount - i)];
                    }
                    else {
                        return (this.idDelta[i] + charCode) % 65536;
                    }
                }
                else {
                    break;
                }
            }
        }
        return 0;
    };
    CmapFormat4.prototype.getGlyphIndex = function (codePoint) {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        return this.mapCharCode(codePoint); // Use existing mapping logic
    };
    CmapFormat4.prototype.getFormatType = function () {
        return this.format; // Return format type
    };
    CmapFormat4.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version, ", ") +
            "segCountX2: ".concat(this.segCountX2, ", searchRange: ").concat(this.searchRange, ", ") +
            "entrySelector: ".concat(this.entrySelector, ", rangeShift: ").concat(this.rangeShift, ", ") +
            "endCode: ".concat(this.endCode, ", startCode: ").concat(this.startCode, ", ") +
            "idDelta: ".concat(this.idDelta, ", idRangeOffset: ").concat(this.idRangeOffset);
    };
    return CmapFormat4;
}());
export { CmapFormat4 };
