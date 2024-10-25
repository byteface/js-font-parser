import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
import { NameRecord } from "./NameRecord.js";
import { DirectoryEntry } from "./DirectoryEntry.js";

export class NameTable {
    formatSelector: number;
    numberOfNameRecords: number;
    stringStorageOffset: number;
    records: NameRecord[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;

        this.formatSelector = byte_ar.readShort();
        this.numberOfNameRecords = byte_ar.readShort();
        this.stringStorageOffset = byte_ar.readShort();

        // Load the records, which contain the encoding information and string offsets
        this.records = [];
        for (let i = 0; i < this.numberOfNameRecords; i++) {
            this.records.push(new NameRecord(byte_ar));
        }

        // Now load the strings
        for (let j = 0; j < this.numberOfNameRecords; j++) {
            this.records[j].loadString(byte_ar, de.offset + this.stringStorageOffset);
        }
    }

    getRecord(nameId: number): string {
        // Search for the first instance of this name ID
        for (let i = 0; i < this.numberOfNameRecords; i++) {
            if (this.records[i].nameId === nameId) {
                return this.records[i].record;
            }
        }
        return "";
    }

    getType(): number {
        return Table.pName;
    }
}
