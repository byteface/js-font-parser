import { Debug } from "../utils/Debug.js";
var CmapFormat4 = /** @class */ (function () {
    function CmapFormat4(byteArray) {
        this.format = 4;
        this.length = 0;
        this.language = 0;
        this.idRangeOffsetStart = 0;
        this.glyphIdArrayStart = 0;
        this.first = 0;
        this.last = 0;
        // Parse basic information
        this.length = byteArray.readUnsignedShort(); // Length of this table
        this.language = byteArray.readUnsignedShort(); // Language code
        this.segCountX2 = byteArray.readUnsignedShort(); // Segment count x 2
        this.segCount = this.segCountX2 / 2; // Actual segment count
        Debug.log("Segment count:", this.segCount, "segCountX2:", this.segCountX2);
        Debug.log(this.language);
        // Initialize arrays
        this.endCode = [];
        this.startCode = [];
        this.idDelta = [];
        this.idRangeOffset = [];
        this.searchRange = byteArray.readUnsignedShort();
        this.entrySelector = byteArray.readUnsignedShort();
        this.rangeShift = byteArray.readUnsignedShort();
        Debug.log("Search range:", this.searchRange, "Entry selector:", this.entrySelector, "Range shift:", this.rangeShift);
        // Parsing end codes
        Debug.log("Parsing end codes:");
        this.last = -1;
        for (var i = 0; i < this.segCount; i++) {
            var endCodeValue = byteArray.readUnsignedShort();
            this.endCode.push(endCodeValue);
            if (endCodeValue > this.last) {
                this.last = endCodeValue;
            }
            // console.log(`Segment ${i}: endCode = ${endCodeValue}, last = ${this.last}`);
        }
        // console.log(this.endCode);
        // NOTE -  If the last endcode is 65535. Thats a sentinel value to show us that its the end
        // of the last segment. which strongly indicates weve parsed the bytes correclty up to this point.
        // Skip reserved padding
        byteArray.readUnsignedShort(); // NOTE - these bytes will be zero
        Debug.log("Parsing start codes:");
        for (var j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
        }
        this.first = Math.min.apply(Math, this.startCode); // Find the minimum startCode
        // console.log(this.startCode);
        // NOTE -  If the last startcode is 65535.
        // then this is likely correct . and the last segment is empty signalling the end of the parse
        // its normal for some segments to be 1 char long . so you may see same values in some array positions
        Debug.log("Parsing idDelta:");
        for (var j = 0; j < this.segCount; j++) {
            this.idDelta.push(byteArray.readShort());
        }
        Debug.log(this.idDelta);
        Debug.log("Parsing idRangeOffset:");
        this.idRangeOffsetStart = byteArray.offset;
        for (var j = 0; j < this.segCount; j++) {
            this.idRangeOffset.push(byteArray.readUnsignedShort());
        }
        Debug.log(this.idRangeOffset);
        this.glyphIdArrayStart = byteArray.offset;
        // Read glyphIdArray (remaining bytes in this subtable)
        var glyphIdArrayLength = (this.length - (16 + 8 * this.segCount)) / 2;
        this.glyphIdArray = [];
        for (var i_1 = 0; i_1 < glyphIdArrayLength; i_1++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
        Debug.log("glyphIdArray length:", this.glyphIdArray.length);
        Debug.log("Finished parsing cmapFormat");
    }
    CmapFormat4.prototype.getFirst = function () {
        return this.first;
    };
    CmapFormat4.prototype.getLast = function () {
        return this.last;
    };
    CmapFormat4.prototype.mapCharCode = function (charCode) {
        Debug.log("mapCharCode", charCode);
        // Handle out-of-bounds
        if (charCode < 0 || charCode >= 0xFFFE)
            return 0;
        for (var i = 0; i < this.segCount; i++) {
            if (this.endCode[i] < charCode) {
                continue;
            }
            if (this.startCode[i] > charCode) {
                break;
            }
            var idRangeOffset = this.idRangeOffset[i];
            if (idRangeOffset === 0) {
                return (this.idDelta[i] + charCode) & 0xffff;
            }
            var glyphOffset = idRangeOffset + 2 * (charCode - this.startCode[i]);
            var absOffset = this.idRangeOffsetStart + (i * 2) + glyphOffset;
            if (absOffset < this.glyphIdArrayStart) {
                return 0;
            }
            var index = (absOffset - this.glyphIdArrayStart) / 2;
            if (index < 0 || index >= this.glyphIdArray.length) {
                return 0;
            }
            var glyphId = this.glyphIdArray[index];
            if (glyphId === 0) {
                return 0;
            }
            return (glyphId + this.idDelta[i]) & 0xffff;
        }
        return 0;
    };
    CmapFormat4.prototype.generateMappingTable = function () {
        Debug.log("generateMappingTable");
        var mappingTable = [];
        for (var i = 0; i < this.segCount; i++) {
            var startCode = this.startCode[i];
            var endCode = this.endCode[i];
            for (var charCode = startCode; charCode <= endCode; charCode++) {
                var glyphIndex = this.mapCharCode(charCode);
                mappingTable.push({ charCode: charCode, glyphIndex: glyphIndex });
            }
        }
        Debug.table(mappingTable);
        return mappingTable;
    };
    CmapFormat4.prototype.getGlyphIndex = function (codePoint) {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        Debug.log("Looking for codePoint", codePoint);
        var glyphId = this.mapCharCode(codePoint); // Use existing mapping logic
        Debug.log("Which is apparently called", glyphId);
        return glyphId;
    };
    CmapFormat4.prototype.getFormatType = function () {
        return this.format; // Return format type
    };
    CmapFormat4.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", language: ").concat(this.language, ", ") +
            "segCountX2: ".concat(this.segCountX2, ", searchRange: ").concat(this.searchRange, ", ") +
            "entrySelector: ".concat(this.entrySelector, ", rangeShift: ").concat(this.rangeShift, ", ") +
            "endCode: ".concat(this.endCode, ", startCode: ").concat(this.startCode, ", ") +
            "idDelta: ".concat(this.idDelta, ", idRangeOffset: ").concat(this.idRangeOffset);
    };
    return CmapFormat4;
}());
export { CmapFormat4 };
