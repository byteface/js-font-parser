import { ByteArray } from "../utils/ByteArray.js";

export class CmapFormat6 {
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
        this.firstCode = 0; // Initialize as needed
        this.entryCount = 0; // Initialize as needed
        this.glyphIdArray = []; // Initialize to an empty array
    }

    getFirst(): number {
        return 0; // Return appropriate value if needed
    }

    getLast(): number {
        return 0; // Return appropriate value if needed
    }

    mapCharCode(charCode: number): number {
        return 0; // Return appropriate value if needed
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}
