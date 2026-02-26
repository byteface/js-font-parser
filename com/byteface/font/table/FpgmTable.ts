import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { Program } from "./Program.js";
import { Table } from "./Table.js";
import { ITable } from "./ITable.js";

export class FpgmTable extends Program implements ITable {
    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        super();
        byte_ar.offset = de.offset;
        this.readInstructions(byte_ar, de.length);
    }

    public getType(): number {
        return Table.fpgm;
    }
}
