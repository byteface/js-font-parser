import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { BaseArray } from './BaseArray.js';
export class MarkBasePosFormat1 extends LookupSubtable {
    markCoverage;
    baseCoverage;
    markClassCount;
    markArray;
    baseArray;
    constructor(byte_ar, offset) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.markCoverage = null;
            this.baseCoverage = null;
            this.markClassCount = 0;
            this.markArray = null;
            this.baseArray = null;
            byte_ar.offset = prev;
            return;
        }
        const markCoverageOffset = byte_ar.readUnsignedShort();
        const baseCoverageOffset = byte_ar.readUnsignedShort();
        this.markClassCount = byte_ar.readUnsignedShort();
        const markArrayOffset = byte_ar.readUnsignedShort();
        const baseArrayOffset = byte_ar.readUnsignedShort();
        byte_ar.offset = offset + markCoverageOffset;
        this.markCoverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + baseCoverageOffset;
        this.baseCoverage = Coverage.read(byte_ar);
        this.markArray = new MarkArray(byte_ar, offset + markArrayOffset);
        this.baseArray = new BaseArray(byte_ar, offset + baseArrayOffset, this.markClassCount);
        byte_ar.offset = prev;
    }
}
