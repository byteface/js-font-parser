import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
export declare class GvarTable implements ITable {
    private start;
    private view;
    private axisCount;
    private glyphCount;
    private sharedTuples;
    private offsets;
    private dataOffset;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getDeltasForGlyph(glyphId: number, coords: number[], pointCount: number): {
        dx: number[];
        dy: number[];
        touched: boolean[];
    } | null;
    private rangePoints;
    private computeScalar;
    private readTuple;
    private readF2Dot14;
    private readPointNumbers;
    private readPackedDeltas;
}
