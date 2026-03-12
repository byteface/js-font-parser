import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class GaspTable implements ITable {
    version: number;
    numRanges: number;
    ranges: {
        rangeMaxPPEM: number;
        rangeGaspBehavior: number;
    }[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
