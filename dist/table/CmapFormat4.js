var CmapFormat4 = /** @class */ (function () {
    /*
        constructor(byteArray: ByteArray) {
            // Parse basic information
            this.length = byteArray.readUnsignedShort();
            this.version = byteArray.readUnsignedShort();
            this.segCountX2 = byteArray.readUnsignedShort();
            this.segCount = this.segCountX2 / 2;
        
            // Parse segment information
            this.endCode = [];
            this.startCode = [];
            this.idDelta = [];
            this.idRangeOffset = [];
        
            for (let i = 0; i < this.segCount; i++) {
                this.endCode.push(byteArray.readUnsignedShort());
            }
        
            byteArray.readUnsignedShort(); // Skip reserved padding
    
            for (let i = 0; i < this.segCount; i++) {
                this.startCode.push(byteArray.readUnsignedShort());
                this.idDelta.push(byteArray.readUnsignedShort());
                this.idRangeOffset.push(byteArray.readUnsignedShort());
            }
        
            // Build the glyph ID array
            this.glyphIdArray = [];
            let offset = 0;
        
            for (let i = 0; i < this.segCount; i++) {
                const startCode = this.startCode[i];
                const endCode = this.endCode[i];
                const idDelta = this.idDelta[i];
                const idRangeOffset = this.idRangeOffset[i];
        
                if (idRangeOffset === 0) {
                    for (let code = startCode; code <= endCode; code++) {
                        this.glyphIdArray.push(code + idDelta);
                    }
                } else {
                    for (let code = startCode; code <= endCode; code++) {
                        const glyphIdOffset = offset + (code - startCode) * 2;
                        this.glyphIdArray.push(byteArray.readUnsignedShort(glyphIdOffset));
                    }
                    offset += idRangeOffset;
                }
            }
        }
    */
    function CmapFormat4(byteArray) {
        this.format = 4;
        this.length = 0;
        this.version = 0;
        this.language = 0;
        this.first = 0;
        this.last = 0;
        // Parse and log basic information
        // this.format = 4; // For Cmap Format 4
        this.length = byteArray.readUnsignedShort(); // Length of this table
        this.version = byteArray.readUnsignedShort(); // Version of the format
        // this.language = byteArray.readUnsignedShort(); // Language code
        this.segCountX2 = byteArray.readUnsignedShort(); // Segment count x 2
        this.segCount = this.segCountX2 / 2; // Actual segment count
        console.log("Segment count:", this.segCount, "segCountX2:", this.segCountX2);
        console.log(this.version, this.language);
        // Initialize arrays
        this.endCode = [];
        this.startCode = [];
        this.idDelta = [];
        this.idRangeOffset = [];
        this.searchRange = byteArray.readUnsignedShort();
        this.entrySelector = byteArray.readUnsignedShort();
        this.rangeShift = byteArray.readUnsignedShort();
        console.log("Search range:", this.searchRange, "Entry selector:", this.entrySelector, "Range shift:", this.rangeShift);
        // Parsing end codes
        console.log("Parsing end codes:");
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
        console.log("Parsing start codes:");
        for (var j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
        }
        this.first = Math.min.apply(Math, this.startCode); // Find the minimum startCode
        // console.log(this.startCode);
        // NOTE -  If the last startcode is 65535.
        // then this is likely correct . and the last segment is empty signalling the end of the parse
        // its normal for some segments to be 1 char long . so you may see same values in some array positions
        console.log("Parsing idDelta:");
        for (var j = 0; j < this.segCount; j++) {
            this.idDelta.push(byteArray.readUnsignedShort());
        }
        console.log(this.idDelta);
        console.log("Parsing idRangeOffset:");
        for (var j = 0; j < this.segCount; j++) {
            this.idRangeOffset.push(byteArray.readUnsignedShort());
        }
        console.log(this.idRangeOffset);
        // Build the glyph ID array
        this.glyphIdArray = [];
        var offset = 0;
        for (var i_1 = 0; i_1 < this.segCount; i_1++) {
            var startCode = this.startCode[i_1];
            var endCode = this.endCode[i_1];
            var idDelta = this.idDelta[i_1];
            var idRangeOffset = this.idRangeOffset[i_1];
            if (idRangeOffset === 0) {
                for (var code = startCode; code <= endCode; code++) {
                    this.glyphIdArray.push(code + idDelta);
                }
            }
            else {
                for (var code = startCode; code <= endCode; code++) {
                    var glyphIdOffset = offset + (code - startCode) * 2;
                    this.glyphIdArray.push(byteArray.readUnsignedShort(glyphIdOffset));
                }
                offset += idRangeOffset;
            }
        }
        // Debug output to verify the contents of glyphIdArray
        console.log("Final glyphIdArray based on idDelta:", this.glyphIdArray);
        // Debug output to verify the contents of glyphIdArray
        console.log("Final glyphIdArray:", this.glyphIdArray);
        console.log("HOW LONG IS IT!!!!!!!", this.glyphIdArray.length);
        console.log("Finished parsing cmapFormat");
    }
    CmapFormat4.prototype.getFirst = function () {
        return this.first;
    };
    CmapFormat4.prototype.getLast = function () {
        return this.last;
    };
    CmapFormat4.prototype.mapCharCode = function (charCode) {
        console.log("😊 GET THE mapCharCode :::::", charCode);
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
    CmapFormat4.prototype.generateMappingTable = function () {
        console.log("generateMappingTable");
        var mappingTable = [];
        for (var i = 0; i < this.segCount; i++) {
            var startCode = this.startCode[i];
            var endCode = this.endCode[i];
            var idDelta = this.idDelta[i];
            var idRangeOffset = this.idRangeOffset[i];
            for (var charCode = startCode; charCode <= endCode; charCode++) {
                var glyphIndex = void 0;
                if (idRangeOffset > 0) {
                    var glyphIdOffsetIndex = idRangeOffset / 2 + (charCode - startCode) - (this.segCount - i);
                    glyphIndex = this.glyphIdArray[glyphIdOffsetIndex] || 0;
                }
                else {
                    glyphIndex = (idDelta + charCode) % 65536;
                }
                // console.log(charCode, glyphIndex);
                mappingTable.push({ charCode: charCode, glyphIndex: glyphIndex });
            }
        }
        console.table(mappingTable);
        return mappingTable;
    };
    CmapFormat4.prototype.getGlyphIndex = function (codePoint) {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        console.log("Looking for codePoint", codePoint);
        var glyphId = this.mapCharCode(codePoint); // Use existing mapping logic
        console.log("Which is apparently called", glyphId);
        for (var i = 0; i < this.glyphIdArray.length; i++) {
            if (this.glyphIdArray[i] === glyphId) {
                console.log("😊😊😊😊 GET THE INDEX :::::", i);
                return i; // Return the index where the glyphId was found
            }
        }
        return null; // Return null if glyphId is not found
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
