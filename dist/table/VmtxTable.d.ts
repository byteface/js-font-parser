import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class VmtxTable implements ITable {
    private buf;
    private advanceHeights;
    private topSideBearings;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    run(numberOfVMetrics: number, tsbCount: number): void;
    getAdvanceHeight(i: number): number;
    getTopSideBearing(i: number): number;
    getType(): number;
}
