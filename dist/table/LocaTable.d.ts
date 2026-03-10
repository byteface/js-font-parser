import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class LocaTable implements ITable {
    private buf;
    private offsets;
    private factor;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    run(numGlyphs: number, shortEntries: boolean): void;
    getOffset(i: number): number;
    getType(): number;
}
