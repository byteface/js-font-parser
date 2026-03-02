import { DirectoryEntry } from "./DirectoryEntry.js";
import { ByteArray } from '../utils/ByteArray.js'

export class TableDirectory {
    version: number;
    numTables: number;
    searchRange: number;
    entrySelector: number;
    rangeShift: number;
    entries: DirectoryEntry[];

    constructor(byte_ar: ByteArray) {
        this.version = byte_ar.readInt();
        this.numTables = byte_ar.readUnsignedShort();
        this.searchRange = byte_ar.readUnsignedShort();
        this.entrySelector = byte_ar.readUnsignedShort();
        this.rangeShift = byte_ar.readUnsignedShort();

        this.entries = [];

        // console.log('tabledir::', this.version, this.numTables, this.searchRange, this.entrySelector, this.rangeShift);

        for (let i = 0; i < this.numTables; i++) {
            this.entries.push(new DirectoryEntry(byte_ar));
        }

        // Bubble sort the entries based on their offset
        let modified = true;
        while (modified) {
            modified = false;

            for (let j = 0; j < this.numTables - 1; j++) {
                const entryA = this.entries[j];
                const entryB = this.entries[j + 1];
            
                if (
                    entryA?.offset != null && // Check if entryA and its offset exist
                    entryB?.offset != null && // Check if entryB and its offset exist
                    entryA.offset > entryB.offset
                ) {
                    const temp = entryA;
                    this.entries[j] = entryB;
                    this.entries[j + 1] = temp;
                    modified = true;
                }
            }
        }
    }

    // Returns an entry by index
    getEntry(index: number): DirectoryEntry {
        return this.entries[index];
    }

    // Returns an entry by tag
    getEntryByTag(tag: string): DirectoryEntry | null {
        for (let i = 0; i < this.numTables; i++) {
            const entryTag = this.entries[i]?.tag;
            
            // Ensure both are strings and compare
            if (entryTag != null && String(entryTag) === tag) {
                return this.entries[i];
            }
        }
        return null;
    }
}
