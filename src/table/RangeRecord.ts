// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";


export class RangeRecord {
    private start: number;
    private end: number;
    private startCoverageIndex: number;

    /** Creates new RangeRecord */
    public constructor(byte_ar: ByteArray) {
        this.start = byte_ar.readUnsignedShort();
        this.end = byte_ar.readUnsignedShort();
        this.startCoverageIndex = byte_ar.readUnsignedShort();
    }

    public isInRange(glyphId: number): boolean {
        return (this.start <= glyphId && glyphId <= this.end);
    }

    public getCoverageIndex(glyphId: number): number {
        if (this.isInRange(glyphId)) {
            return this.startCoverageIndex + glyphId - this.start;
        }
        return -1;
    }
}
