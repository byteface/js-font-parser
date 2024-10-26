import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat6 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    firstCode: number;
    entryCount: number;
    glyphIdArray: number[];

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();

        this.format = 6;
        this.firstCode = byteArray.readUnsignedShort(); // Read firstCode from the ByteArray
        this.entryCount = byteArray.readUnsignedShort(); // Read entryCount from the ByteArray
        this.glyphIdArray = [];

        // Populate glyphIdArray with the glyph IDs
        for (let i = 0; i < this.entryCount; i++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }

    getFirst(): number {
        return this.firstCode; // Return the first character code
    }

    getLast(): number {
        // Calculate the last code based on firstCode and entryCount
        return this.firstCode + this.entryCount - 1;
    }

    mapCharCode(charCode: number): number {
        // Check if charCode falls within the range of firstCode and lastCode
        if (charCode < this.firstCode || charCode > this.getLast()) {
            return 0; // Out of bounds
        }

        // Calculate index in glyphIdArray
        const index = charCode - this.firstCode;
        return this.glyphIdArray[index] || 0; // Return glyph ID or 0 if not found
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, ` +
            `firstCode: ${this.firstCode}, entryCount: ${this.entryCount}, ` +
            `glyphIdArray: ${this.glyphIdArray}`;
    }
}
