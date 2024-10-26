import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat0 implements ICmapFormat {

    glyphIdArray: number[];
    first: number;
    last: number;
    format: number;
    length: number;
    version: number;

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();

        this.format = 0;
        this.first = -1;
        this.last = -1; // Initialize last to -1

        this.glyphIdArray = new Array(256); // Initialize the array

        for (let i = 0; i < 256; i++) {
            this.glyphIdArray[i] = byteArray.readByte();

            if (this.glyphIdArray[i] > 0) {
                if (this.first === -1) this.first = i;
                this.last = i;
            }
        }
    }

    getFirst(): number {
        return this.first;
    }

    getLast(): number {
        return this.last;
    }

    mapCharCode(charCode: number): number {
        if (0 <= charCode && charCode < 256) {
            return this.glyphIdArray[charCode];
        } else {
            return 0;
        }
    }

    // Method to get the format type (always returns 0 for CmapFormat0)
    getFormatType(): number {
        return this.format;
    }

    // Method to get the glyph index for a given code point
    getGlyphIndex(codePoint: number): number | null {
        if (codePoint >= 0 && codePoint < this.glyphIdArray.length) {
            return this.glyphIdArray[codePoint];
        }
        return null;
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}
