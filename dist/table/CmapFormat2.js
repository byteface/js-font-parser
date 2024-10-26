var CmapFormat2 = /** @class */ (function () {
    function CmapFormat2(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 2;
        // Parse subHeaderKeys
        this.subHeaderKeys = [];
        for (var i = 0; i < 256; i++) {
            this.subHeaderKeys[i] = byteArray.readUnsignedShort();
        }
        // Parse subHeaders based on the keys
        this.subHeaders = [];
        for (var i = 0; i < this.subHeaderKeys.length; i++) {
            if (this.subHeaderKeys[i] !== 0) {
                this.subHeaders.push(this.parseSubHeader(byteArray));
            }
        }
        // Parse glyphIndexArray, based on subHeader data
        this.glyphIndexArray = [];
        for (var i = 0; i < this.length - byteArray.offset; i++) {
            this.glyphIndexArray.push(byteArray.readUnsignedShort());
        }
    }
    CmapFormat2.prototype.parseSubHeader = function (byteArray) {
        // Define parsing logic based on the specific structure of subHeaders.
        return {
            firstCode: byteArray.readUnsignedShort(),
            entryCount: byteArray.readUnsignedShort(),
            idDelta: byteArray.readShort(),
            idRangeOffset: byteArray.readUnsignedShort(),
        };
    };
    CmapFormat2.prototype.getFormatType = function () {
        return this.format;
    };
    CmapFormat2.prototype.getGlyphIndex = function (codePoint) {
        var subHeaderIndex = this.subHeaderKeys[codePoint >> 8];
        var subHeader = this.subHeaders[subHeaderIndex];
        if (!subHeader) {
            return null;
        }
        var lowByte = codePoint & 0xFF;
        var glyphIndexOffset = subHeader.idRangeOffset / 2 + (lowByte - subHeader.firstCode);
        if (lowByte < subHeader.firstCode || lowByte >= subHeader.firstCode + subHeader.entryCount) {
            return null;
        }
        var glyphIndex = this.glyphIndexArray[glyphIndexOffset];
        return glyphIndex === 0 ? null : (glyphIndex + subHeader.idDelta) % 65536;
    };
    CmapFormat2.prototype.getFirst = function () {
        return Math.min.apply(Math, this.subHeaderKeys);
    };
    CmapFormat2.prototype.getLast = function () {
        return Math.max.apply(Math, this.subHeaderKeys);
    };
    CmapFormat2.prototype.mapCharCode = function (charCode) {
        var glyphIndex = this.getGlyphIndex(charCode);
        return glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0;
    };
    CmapFormat2.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version);
    };
    return CmapFormat2;
}());
export { CmapFormat2 };
/*

Original code was minimal. but chatGPT just offered the above solutoin
where was it 12 years ago. haha

import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat2 implements ICmapFormat {
    subHeaderKeys: number[];
    subHeaders1: any; // Adjust type as necessary based on your implementation
    subHeaders2: any; // Adjust type as necessary based on your implementation
    glyphIndexArray: any; // Adjust type as necessary based on your implementation
    format: number;
    length: number;
    version: number;

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 2;

        // Initialize arrays
        this.subHeaderKeys = [];
        this.subHeaders1 = null; // Set based on your specific implementation
        this.subHeaders2 = null; // Set based on your specific implementation
        this.glyphIndexArray = null; // Set based on your specific implementation
    }

    getFirst(): number {
        return 0; // Modify as necessary
    }

    getLast(): number {
        return 0; // Modify as necessary
    }

    mapCharCode(charCode: number): number {
        return 0; // Modify as necessary
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}
*/ 
