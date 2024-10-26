import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat4 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    language: number;
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
    first: number;
    last: number;

    constructor(byteArray: ByteArray) {
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
        for (let i = 0; i < this.segCount; i++) {
            this.endCode.push(byteArray.readUnsignedShort());
            if (this.endCode[i] > this.last) this.last = this.endCode[i];
        }

        byteArray.readUnsignedShort(); // reservePad

        this.first = Number.MAX_SAFE_INTEGER; // Initialize with maximum value
        for (let j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
            if (this.startCode[j] < this.first) this.first = this.startCode[j];
        }

        for (let k = 0; k < this.segCount; k++) {
            this.idDelta.push(byteArray.readUnsignedShort());
        }

        for (let l = 0; l < this.segCount; l++) {
            this.idRangeOffset.push(byteArray.readUnsignedShort());
        }

        // Whatever remains of this header belongs in glyphIdArray
        const count = (this.length - 16 - (this.segCount * 8)) / 2;
        this.glyphIdArray = [];
        for (let m = 0; m < count; m++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }

    getFirst(): number {
        return this.first;
    }

    getLast(): number {
        return this.last;
    }

    mapCharCode(charCode: number): number {
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

    getGlyphIndex(codePoint: number): number | null {
        // Ensure codePoint is within valid range
        if (codePoint < this.first || codePoint > this.last) {
            return null; // Out of range
        }
        return this.mapCharCode(codePoint); // Use existing mapping logic
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
