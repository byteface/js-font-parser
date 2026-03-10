import { Table } from "./Table.js";
import { NameRecord } from "./NameRecord.js";
export class NameTable {
    formatSelector;
    numberOfNameRecords;
    stringStorageOffset;
    records;
    constructor(de, byte_ar) {
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
    getRecord(nameId) {
        // Search for the first instance of this name ID
        for (let i = 0; i < this.numberOfNameRecords; i++) {
            if (this.records[i].nameId === nameId) {
                return this.records[i].record;
            }
        }
        return "";
    }
    getType() {
        return Table.pName;
    }
}
