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
    private _formats: Array<ICmapFormat | null>;
    private formatKinds: number[];
    private loadedFormats: boolean[];
    private baseOffset: number;
    private data: Uint8Array;

    constructor(de:DirectoryEntry, byteArray: ByteArray) {
        this.baseOffset = de.offset;
        this.data = new Uint8Array(
            byteArray.dataView.buffer,
            byteArray.dataView.byteOffset,
            byteArray.dataView.byteLength
        );
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
        this._formats = new Array(this.numTables).fill(null);
        this.formatKinds = new Array(this.numTables).fill(-1);
        this.loadedFormats = new Array(this.numTables).fill(false);
        for (let j = 0; j < this.numTables; j++) {
            byteArray.offset = fp + this.entries[j].offset;
            this.formatKinds[j] = byteArray.readUnsignedShort();
        }

        if (Debug.enabled) {
            Debug.log(this.toString());
        }
    }

    get formats(): Array<ICmapFormat | null> {
        for (let i = 0; i < this.numTables; i++) {
            this.ensureFormatLoaded(i);
        }
        return this._formats;
    }

    getCmapFormat(platformId: number, encodingId: number): ICmapFormat | null {
        // Find the requested format
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.ensureFormatLoaded(i);
            }
        }
        return null;
    }

    getCmapFormats(platformId: number, encodingId: number): ICmapFormat[] {
        const matches: ICmapFormat[] = [];
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                const fmt = this.ensureFormatLoaded(i);
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
            const fmt = this.ensureFormatLoaded(i);
            sb.push(`\t${fmt ? fmt.toString() : "unknown cmap format"}\n`);
        }

        return sb.join('');
    }

    private ensureFormatLoaded(index: number): ICmapFormat | null {
        if (this.loadedFormats[index]) {
            return this._formats[index] ?? null;
        }
        return this.loadFormat(index);
    }

    private loadFormat(index: number): ICmapFormat | null {
        this.loadedFormats[index] = true;
        const entry = this.entries[index];
        const byteArray = new ByteArray(this.data);
        byteArray.offset = this.baseOffset + entry.offset;
        byteArray.readUnsignedShort();
        const value = CmapFormat.create(this.formatKinds[index], byteArray);
        this._formats[index] = value;
        return value;
    }
}
