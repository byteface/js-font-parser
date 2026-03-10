import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { Program } from "./Program.js";
import { ITable } from "./ITable.js";
export declare class FpgmTable extends Program implements ITable {
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
