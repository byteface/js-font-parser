// UNTESTED
export class RangeRecord {
    start;
    end;
    startCoverageIndex;
    /** Creates new RangeRecord */
    constructor(byte_ar) {
        this.start = byte_ar.readUnsignedShort();
        this.end = byte_ar.readUnsignedShort();
        this.startCoverageIndex = byte_ar.readUnsignedShort();
    }
    isInRange(glyphId) {
        return (this.start <= glyphId && glyphId <= this.end);
    }
    getCoverageIndex(glyphId) {
        if (this.isInRange(glyphId)) {
            return this.startCoverageIndex + glyphId - this.start;
        }
        return -1;
    }
}
