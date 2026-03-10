import { ByteArray } from "../utils/ByteArray.js";
import { ITable } from "./ITable.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
export declare class HheaTable implements ITable {
    version: number;
    ascender: number;
    descender: number;
    lineGap: number;
    advanceWidthMax: number;
    minLeftSideBearing: number;
    minRightSideBearing: number;
    xMaxExtent: number;
    caretSlopeRise: number;
    caretSlopeRun: number;
    metricDataFormat: number;
    numberOfHMetrics: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
