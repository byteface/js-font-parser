import { ByteArray } from "../utils/ByteArray.js";
import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { CmapFormat } from "./CmapFormat.js";
import { Table } from "./Table.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";

export class CmapTable implements ITable {
    version: number;
    numTables: number;
    entries: CmapIndexEntry[];
    formats: any[]; // Change to a specific type based on CmapFormat

    constructor(de:DirectoryEntry, byteArray: ByteArray) {
        byteArray.offset = de.offset;

        const fp = byteArray.offset;
        this.version = byteArray.readUnsignedShort();
        this.numTables = byteArray.readUnsignedShort();

        // Get each of the index entries
        this.entries = [];
        for (let i = 0; i < this.numTables; i++) {
            this.entries.push(new CmapIndexEntry(byteArray));
        }

        // Get each of the tables
        this.formats = [];
        for (let j = 0; j < this.numTables; j++) {
            byteArray.offset = fp + this.entries[j].offset;
            const format = byteArray.readUnsignedShort();
            const cmf = new CmapFormat(byteArray);
            const value = CmapFormat.create(format, byteArray);
            this.formats.push(value);
        }
    }

    getCmapFormat(platformId: number, encodingId: number): any | null {
        // Find the requested format
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.formats[i];
            }
        }
        return null;
    }

    getType(): number {
        return Table.cmap;
    }

    toString(): string {
        const sb: string[] = ["cmap\n"];
        
        // Get each of the index entries
        for (let i = 0; i < this.numTables; i++) {
            sb.push(`\t${this.entries[i].toString()}\n`);
        }

        // Get each of the tables
        for (let i = 0; i < this.numTables; i++) {
            sb.push(`\t${this.formats[i].toString()}\n`);
        }

        return sb.join('');
    }
}
