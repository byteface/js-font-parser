import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";

export class CmapFormat12 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    numGroups: number;
    groups: { start: number; end: number; glyphId: number }[];

    constructor(byteArray: ByteArray) {
        this.length = byteArray.readUnsignedShort(); // Read length
        this.version = byteArray.readUnsignedShort(); // Read version
        this.format = 12; // Set format number

        this.numGroups = byteArray.readUnsignedInt(); // Read number of groups
        this.groups = []; // Initialize groups array

        // Read each group
        for (let i = 0; i < this.numGroups; i++) {
            const start = byteArray.readUnsignedInt();
            const end = byteArray.readUnsignedInt();
            const glyphId = byteArray.readUnsignedInt();
            this.groups.push({ start, end, glyphId });
        }
    }

    getFormatType(): number {
        return this.format;
    }

    getGlyphIndex(charCode: number): number {
        // Iterate through the groups to find the corresponding glyph ID
        for (const group of this.groups) {
            if (charCode >= group.start && charCode <= group.end) {
                return group.glyphId + (charCode - group.start); // Calculate glyph ID
            }
        }
        return 0; // Return 0 if not found
    }

    getFirst(): number {
        return this.groups.length > 0 ? this.groups[0].start : 0;
    }

    getLast(): number {
        return this.groups.length > 0 ? this.groups[this.groups.length - 1].end : 0;
    }

    mapCharCode(charCode: number): number {
        return this.getGlyphIndex(charCode);
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, numGroups: ${this.numGroups}`;
    }
}
