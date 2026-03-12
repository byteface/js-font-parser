import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class GaspTable implements ITable {
    version: number;
    numRanges: number;
    ranges: { rangeMaxPPEM: number; rangeGaspBehavior: number }[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numRanges = byte_ar.readUnsignedShort();
        this.ranges = [];
        for (let i = 0; i < this.numRanges; i++) {
            this.ranges.push({
                rangeMaxPPEM: byte_ar.readUnsignedShort(),
                rangeGaspBehavior: byte_ar.readUnsignedShort()
            });
        }
    }

    getType(): number {
        return Table.gasp;
    }
}
