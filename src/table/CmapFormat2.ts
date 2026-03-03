import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat2 implements ICmapFormat {
    subHeaderKeys: number[];
    subHeaders: any[];  // Define a specific type for subHeaders if available
    glyphIndexArray: number[];
    format: number;
    length: number;
    version: number;

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 2;

        // Parse subHeaderKeys
        this.subHeaderKeys = [];
        for (let i = 0; i < 256; i++) {
            this.subHeaderKeys[i] = byteArray.readUnsignedShort();
        }

        // Parse subHeaders based on the keys
        this.subHeaders = [];
        for (let i = 0; i < this.subHeaderKeys.length; i++) {
            if (this.subHeaderKeys[i] !== 0) {
                this.subHeaders.push(this.parseSubHeader(byteArray));
            }
        }

        // Parse glyphIndexArray, based on subHeader data
        this.glyphIndexArray = [];
        for (let i = 0; i < this.length - byteArray.offset; i++) {
            this.glyphIndexArray.push(byteArray.readUnsignedShort());
        }
    }

    parseSubHeader(byteArray: ByteArray): any {
        // Define parsing logic based on the specific structure of subHeaders.
        return {
            firstCode: byteArray.readUnsignedShort(),
            entryCount: byteArray.readUnsignedShort(),
            idDelta: byteArray.readShort(),
            idRangeOffset: byteArray.readUnsignedShort(),
        };
    }

    getFormatType(): number {
        return this.format;
    }

    getGlyphIndex(codePoint: number): number | null {
        const subHeaderIndex = this.subHeaderKeys[codePoint >> 8];
        const subHeader = this.subHeaders[subHeaderIndex];

        if (!subHeader) {
            return null;
        }

        const lowByte = codePoint & 0xFF;
        const glyphIndexOffset = subHeader.idRangeOffset / 2 + (lowByte - subHeader.firstCode);

        if (lowByte < subHeader.firstCode || lowByte >= subHeader.firstCode + subHeader.entryCount) {
            return null;
        }

        const glyphIndex = this.glyphIndexArray[glyphIndexOffset];
        return glyphIndex === 0 ? null : (glyphIndex + subHeader.idDelta) % 65536;
    }

    getFirst(): number {
        return Math.min(...this.subHeaderKeys);
    }

    getLast(): number {
        return Math.max(...this.subHeaderKeys);
    }

    mapCharCode(charCode: number): number {
        const glyphIndex = this.getGlyphIndex(charCode);
        return glyphIndex ?? 0;
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}




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