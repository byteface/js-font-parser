import { ByteArray } from "../utils/ByteArray.js";
import { ITable } from "./ITable.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
export declare class VheaTable implements ITable {
    version: number;
    ascender: number;
    descender: number;
    lineGap: number;
    advanceHeightMax: number;
    minTopSideBearing: number;
    minBottomSideBearing: number;
    yMaxExtent: number;
    caretSlopeRise: number;
    caretSlopeRun: number;
    caretOffset: number;
    metricDataFormat: number;
    numberOfVMetrics: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
