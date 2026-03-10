// UNTESTED
// import { Coverage } from './Coverage.js';
import { RangeRecord } from './RangeRecord.js';
export class CoverageFormat2 {
    rangeCount;
    rangeRecords;
    constructor(byte_ar) {
        this.rangeCount = byte_ar.readUnsignedShort();
        this.rangeRecords = new Array(this.rangeCount);
        for (let i = 0; i < this.rangeCount; i++) {
            this.rangeRecords[i] = new RangeRecord(byte_ar);
        }
    }
    getFormat() {
        return 2;
    }
    findGlyph(glyphId) {
        for (let i = 0; i < this.rangeCount; i++) {
            const n = this.rangeRecords[i].getCoverageIndex(glyphId);
            if (n > -1) {
                return n;
            }
        }
        return -1;
    }
}
