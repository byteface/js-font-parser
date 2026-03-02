// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
// import { Coverage } from './Coverage.js';
import { RangeRecord } from './RangeRecord.js';
import { ICoverage } from './ICoverage.js';



export class CoverageFormat2 implements ICoverage {
    private rangeCount: number;
    private rangeRecords: RangeRecord[];

    constructor(byte_ar: ByteArray) {
        this.rangeCount = byte_ar.readUnsignedShort();
        this.rangeRecords = new Array(this.rangeCount);
        for (let i: number = 0; i < this.rangeCount; i++) {
            this.rangeRecords[i] = new RangeRecord(byte_ar);
        }
    }

    public getFormat(): number {
        return 2;
    }

    public findGlyph(glyphId: number): number {
        for (let i: number = 0; i < this.rangeCount; i++) {
            const n: number = this.rangeRecords[i].getCoverageIndex(glyphId);
            if (n > -1) {
                return n;
            }
        }
        return -1;
    }
}
