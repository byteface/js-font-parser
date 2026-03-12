import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class LtshTable implements ITable {
    version: number;
    numGlyphs: number;
    yPels: number[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
