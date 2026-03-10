import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class CvtTable implements ITable {
    private values;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getValues(): number[];
}
