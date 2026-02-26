import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat4 implements ICmapFormat {
    format: number = 4;
    length: number = 0;
    version: number = 0;
    language: number = 0;
    segCountX2: number;
    searchRange: number;
    entrySelector: number;
    rangeShift: number;
    endCode: number[];
    startCode: number[];
    idDelta: number[];
    idRangeOffset: number[];
    glyphIdArray: number[];
    segCount: number;
    first: number = 0;
    last: number = 0;


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

    
    constructor(byteArray: ByteArray) {

        // Parse and log basic information
        // this.format = 4; // For Cmap Format 4
        this.length = byteArray.readUnsignedShort(); // Length of this table
        this.version = byteArray.readUnsignedShort(); // Version of the format
        // this.language = byteArray.readUnsignedShort(); // Language code
        this.segCountX2 = byteArray.readUnsignedShort(); // Segment count x 2
        this.segCount = this.segCountX2 / 2; // Actual segment count

        console.log("Segment count:", this.segCount, "segCountX2:", this.segCountX2);
        console.log( this.version, this.language )
    
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

        console.log("Parsing start codes:");
        for (var j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
        }
        this.first = Math.min(...this.startCode); // Find the minimum startCode

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





        // Debug output to verify the contents of glyphIdArray
        console.log("Final glyphIdArray based on idDelta:", this.glyphIdArray);


        // Debug output to verify the contents of glyphIdArray
        
        console.log("Final glyphIdArray:", this.glyphIdArray);

        console.log( "HOW LONG IS IT!!!!!!!", this.glyphIdArray.length )

        console.log("Finished parsing cmapFormat");
    }



    getFirst(): number {
        return this.first;
    }

    getLast(): number {
        return this.last;
    }

    mapCharCode(charCode: number): number {

        console.log( "😊 GET THE mapCharCode :::::", charCode );

        // Handle out-of-bounds
        if (charCode < 0 || charCode >= 0xFFFE) return 0;

        for (let i = 0; i < this.segCount; i++) {
            if (this.endCode[i] >= charCode) {
                if (this.startCode[i] <= charCode) {
                    if (this.idRangeOffset[i] > 0) {
                        return this.glyphIdArray[this.idRangeOffset[i] / 2 +
                            (charCode - this.startCode[i]) - (this.segCount - i)];
                    } else {
                        return (this.idDelta[i] + charCode) % 65536;
                    }
                } else {
                    break;
                }
            }
        }
        return 0;
    }


    generateMappingTable() {
        console.log("generateMappingTable");
        const mappingTable = [];
    
        for (let i = 0; i < this.segCount; i++) {
            const startCode = this.startCode[i];
            const endCode = this.endCode[i];
            const idDelta = this.idDelta[i];
            const idRangeOffset = this.idRangeOffset[i];
            
            for (let charCode = startCode; charCode <= endCode; charCode++) {
                let glyphIndex;
                if (idRangeOffset > 0) {
                    const glyphIdOffsetIndex = idRangeOffset / 2 + (charCode - startCode) - (this.segCount - i);
                    glyphIndex = this.glyphIdArray[glyphIdOffsetIndex] || 0;
                } else {
                    glyphIndex = (idDelta + charCode) % 65536;
                }
                // console.log(charCode, glyphIndex);
                mappingTable.push({ charCode, glyphIndex });
            }
        }
    
        console.table(mappingTable);
        return mappingTable;
    }


    getGlyphIndex(codePoint: number): number | null {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        console.log("Looking for codePoint", codePoint);

        var glyphId = this.mapCharCode(codePoint); // Use existing mapping logic
        
        console.log("Which is apparently called", glyphId);

        for (let i = 0; i < this.glyphIdArray.length; i++) {
            if (this.glyphIdArray[i] === glyphId) {
                console.log( "😊😊😊😊 GET THE INDEX :::::", i );
                return i; // Return the index where the glyphId was found
            }
        }
        return null; // Return null if glyphId is not found
    }

    getFormatType(): number {
        return this.format; // Return format type
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, ` +
            `segCountX2: ${this.segCountX2}, searchRange: ${this.searchRange}, ` +
            `entrySelector: ${this.entrySelector}, rangeShift: ${this.rangeShift}, ` +
            `endCode: ${this.endCode}, startCode: ${this.startCode}, ` +
            `idDelta: ${this.idDelta}, idRangeOffset: ${this.idRangeOffset}`;
    }
}
