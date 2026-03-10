import { ByteArray } from "../utils/ByteArray.js";
import { NameRecord } from "./NameRecord.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class NameTable implements ITable {
    formatSelector: number;
    numberOfNameRecords: number;
    stringStorageOffset: number;
    records: NameRecord[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getRecord(nameId: number): string;
    getType(): number;
}
