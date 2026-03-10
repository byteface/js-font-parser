import { Debug } from "../utils/Debug.js";
export class CmapFormat4 {
    format = 4;
    length = 0;
    language = 0;
    segCountX2;
    searchRange;
    entrySelector;
    rangeShift;
    endCode;
    startCode;
    idDelta;
    idRangeOffset;
    glyphIdArray;
    idRangeOffsetStart = 0;
    glyphIdArrayStart = 0;
    segCount;
    first = 0;
    last = 0;
    constructor(byteArray) {
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
            const endCodeValue = byteArray.readUnsignedShort();
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
        this.first = Math.min(...this.startCode); // Find the minimum startCode
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
        const glyphIdArrayLength = (this.length - (16 + 8 * this.segCount)) / 2;
        this.glyphIdArray = [];
        for (let i = 0; i < glyphIdArrayLength; i++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
        Debug.log("glyphIdArray length:", this.glyphIdArray.length);
        Debug.log("Finished parsing cmapFormat");
    }
    getFirst() {
        return this.first;
    }
    getLast() {
        return this.last;
    }
    mapCharCode(charCode) {
        Debug.log("mapCharCode", charCode);
        // Handle out-of-bounds
        if (charCode < 0 || charCode >= 0xFFFE)
            return 0;
        for (let i = 0; i < this.segCount; i++) {
            if (this.endCode[i] < charCode) {
                continue;
            }
            if (this.startCode[i] > charCode) {
                break;
            }
            const idRangeOffset = this.idRangeOffset[i];
            if (idRangeOffset === 0) {
                return (this.idDelta[i] + charCode) & 0xffff;
            }
            const glyphOffset = idRangeOffset + 2 * (charCode - this.startCode[i]);
            const absOffset = this.idRangeOffsetStart + (i * 2) + glyphOffset;
            if (absOffset < this.glyphIdArrayStart) {
                return 0;
            }
            const index = (absOffset - this.glyphIdArrayStart) / 2;
            if (index < 0 || index >= this.glyphIdArray.length) {
                return 0;
            }
            const glyphId = this.glyphIdArray[index];
            if (glyphId === 0) {
                return 0;
            }
            return (glyphId + this.idDelta[i]) & 0xffff;
        }
        return 0;
    }
    generateMappingTable() {
        Debug.log("generateMappingTable");
        const mappingTable = [];
        for (let i = 0; i < this.segCount; i++) {
            const startCode = this.startCode[i];
            const endCode = this.endCode[i];
            for (let charCode = startCode; charCode <= endCode; charCode++) {
                const glyphIndex = this.mapCharCode(charCode);
                mappingTable.push({ charCode, glyphIndex });
            }
        }
        Debug.table(mappingTable);
        return mappingTable;
    }
    getGlyphIndex(codePoint) {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        Debug.log("Looking for codePoint", codePoint);
        const glyphId = this.mapCharCode(codePoint); // Use existing mapping logic
        Debug.log("Which is apparently called", glyphId);
        return glyphId;
    }
    getFormatType() {
        return this.format; // Return format type
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, language: ${this.language}, ` +
            `segCountX2: ${this.segCountX2}, searchRange: ${this.searchRange}, ` +
            `entrySelector: ${this.entrySelector}, rangeShift: ${this.rangeShift}, ` +
            `endCode: ${this.endCode}, startCode: ${this.startCode}, ` +
            `idDelta: ${this.idDelta}, idRangeOffset: ${this.idRangeOffset}`;
    }
}
