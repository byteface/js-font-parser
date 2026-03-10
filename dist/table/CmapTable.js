import { ByteArray } from "../utils/ByteArray.js";
import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { CmapFormat } from "./CmapFormat.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
export class CmapTable {
    version;
    numTables;
    entries;
    _formats;
    formatKinds;
    loadedFormats;
    baseOffset;
    data;
    constructor(de, byteArray) {
        this.baseOffset = de.offset;
        this.data = new Uint8Array(byteArray.dataView.buffer, byteArray.dataView.byteOffset, byteArray.dataView.byteLength);
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
    get formats() {
        for (let i = 0; i < this.numTables; i++) {
            this.ensureFormatLoaded(i);
        }
        return this._formats;
    }
    getCmapFormat(platformId, encodingId) {
        // Find the requested format
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.ensureFormatLoaded(i);
            }
        }
        return null;
    }
    getCmapFormats(platformId, encodingId) {
        const matches = [];
        for (let i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                const fmt = this.ensureFormatLoaded(i);
                if (fmt)
                    matches.push(fmt);
            }
        }
        return matches;
    }
    getType() {
        return Table.cmap;
    }
    toString() {
        const sb = ["cmap\n"];
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
    ensureFormatLoaded(index) {
        if (this.loadedFormats[index]) {
            return this._formats[index] ?? null;
        }
        return this.loadFormat(index);
    }
    loadFormat(index) {
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
