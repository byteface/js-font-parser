import { ByteArray } from "../utils/ByteArray.js";
import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { CmapFormat } from "./CmapFormat.js";
import { ICmapFormat } from "./ICmapFormat.js";
import { Table } from "./Table.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Debug } from "../utils/Debug.js";

export class CmapTable implements ITable {
    version: number;
    numTables: number;
    entries: CmapIndexEntry[];
    formats: Array<ICmapFormat | null>;

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
            Debug.log('Theres a table', j);
            byteArray.offset = fp + this.entries[j].offset;
            const format = byteArray.readUnsignedShort();
            // const cmf = new CmapFormat(byteArray);
            const value = CmapFormat.create(format, byteArray);
            this.formats.push(value);
        }

        Debug.log(this.toString());
    }

    getCmapFormat(platformId: number, encodingId: number): ICmapFormat | null {
        // Find the requested format
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.formats[i] ?? null;
            }
        }
        return null;
    }

    getCmapFormats(platformId: number, encodingId: number): ICmapFormat[] {
        const matches: ICmapFormat[] = [];
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                const fmt = this.formats[i];
                if (fmt) matches.push(fmt);
            }
        }
        return matches;
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
            const fmt = this.formats[i];
            sb.push(`\t${fmt ? fmt.toString() : "unknown cmap format"}\n`);
        }

        return sb.join('');
    }
}
