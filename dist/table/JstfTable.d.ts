import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { BaseTable } from "./BaseTable.js";
export declare class JstfTable extends BaseTable implements ITable {
    version: number;
    scriptCount: number;
    scriptRecords: {
        tag: string;
        offset: number;
    }[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
