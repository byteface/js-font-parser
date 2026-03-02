import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat10 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    glyphIdArray: number[];
    characterCodes: number[];

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 10;

        // Read the number of character codes
        const numCodes = byteArray.readUnsignedShort();
        this.characterCodes = [];
        this.glyphIdArray = [];

        // Read character codes and corresponding glyph IDs
        for (let i = 0; i < numCodes; i++) {
            this.characterCodes.push(byteArray.readUnsignedShort());
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }

    getFormatType(): number {
        return this.format; // Return the format type
    }

    getGlyphIndex(charCode: number): number {
        // Use binary search or linear search to find the character code
        const index = this.characterCodes.indexOf(charCode);
        return index !== -1 ? this.glyphIdArray[index] : 0; // Return corresponding glyph ID or 0 if not found
    }

    getFirst(): number {
        return this.characterCodes.length > 0 ? this.characterCodes[0] : 0; // Return the first character code
    }

    getLast(): number {
        return this.characterCodes.length > 0 ? this.characterCodes[this.characterCodes.length - 1] : 0; // Return the last character code
    }

    mapCharCode(charCode: number): number {
        return this.getGlyphIndex(charCode); // Use getGlyphIndex for mapping
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, ` +
            `characterCodes: ${this.characterCodes}, glyphIdArray: ${this.glyphIdArray}`;
    }
}
