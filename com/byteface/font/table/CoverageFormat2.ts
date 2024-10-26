// UNTESTED

import { ByteArray } from '../utils/ByteArray';
import { Coverage } from './Coverage';
import { RangeRecord } from './RangeRecord';


export class CoverageFormat2 extends Coverage {
    private rangeCount: number;
    private rangeRecords: RangeRecord[];

    /** Creates new CoverageFormat2 */
    public constructor(byte_ar: ByteArray) {
        super(); // Call the parent constructor
        this.rangeCount = byte_ar.readUnsignedShort();
        this.rangeRecords = new Array(this.rangeCount);
        for (let i: number = 0; i < this.rangeCount; i++) {
            this.rangeRecords[i] = new RangeRecord(byte_ar);
        }
    }

    public override getFormat(): number {
        return 2;
    }

    public override findGlyph(glyphId: number): number {
        for (let i: number = 0; i < this.rangeCount; i++) {
            const n: number = this.rangeRecords[i].getCoverageIndex(glyphId);
            if (n > -1) {
                return n;
            }
        }
        return -1;
    }
}
