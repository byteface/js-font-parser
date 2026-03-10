import { ByteArray } from "../utils/ByteArray.js";
export declare class RangeRecord {
    private start;
    private end;
    private startCoverageIndex;
    /** Creates new RangeRecord */
    constructor(byte_ar: ByteArray);
    isInRange(glyphId: number): boolean;
    getCoverageIndex(glyphId: number): number;
}
