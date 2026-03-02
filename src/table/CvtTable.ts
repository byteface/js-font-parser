import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { Table } from "./Table.js";
import { ITable } from "./ITable.js";

export class CvtTable implements ITable {
    private values: number[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        const len = Math.floor(de.length / 2);
        this.values = new Array(len);
        for (let i = 0; i < len; i++) {
            this.values[i] = byte_ar.readShort();
        }
    }

    public getType(): number {
        return Table.cvt;
    }

    public getValues(): number[] {
        return this.values;
    }
}
