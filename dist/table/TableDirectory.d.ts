import { DirectoryEntry } from "./DirectoryEntry.js";
import { ByteArray } from '../utils/ByteArray.js';
export declare class TableDirectory {
    version: number;
    numTables: number;
    searchRange: number;
    entrySelector: number;
    rangeShift: number;
    entries: DirectoryEntry[];
    constructor(byte_ar: ByteArray);
    getEntry(index: number): DirectoryEntry;
    getEntryByTag(tag: string): DirectoryEntry | null;
}
