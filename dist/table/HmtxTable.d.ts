import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class HmtxTable implements ITable {
    private buf;
    private advanceWidths;
    private leftSideBearing;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    run(numberOfHMetrics: number, lsbCount: number): void;
    getAdvanceWidth(i: number): number;
    getLeftSideBearing(i: number): number;
    getType(): number;
}
