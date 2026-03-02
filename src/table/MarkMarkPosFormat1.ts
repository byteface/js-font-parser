import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { Mark2Array } from './Mark2Array.js';

export class MarkMarkPosFormat1 extends LookupSubtable {
    mark1Coverage: ICoverage | null;
    mark2Coverage: ICoverage | null;
    markClassCount: number;
    mark1Array: MarkArray | null;
    mark2Array: Mark2Array | null;

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;

        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.mark1Coverage = null;
            this.mark2Coverage = null;
            this.markClassCount = 0;
            this.mark1Array = null;
            this.mark2Array = null;
            byte_ar.offset = prev;
            return;
        }

        const mark1CoverageOffset = byte_ar.readUnsignedShort();
        const mark2CoverageOffset = byte_ar.readUnsignedShort();
        this.markClassCount = byte_ar.readUnsignedShort();
        const mark1ArrayOffset = byte_ar.readUnsignedShort();
        const mark2ArrayOffset = byte_ar.readUnsignedShort();

        byte_ar.offset = offset + mark1CoverageOffset;
        this.mark1Coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + mark2CoverageOffset;
        this.mark2Coverage = Coverage.read(byte_ar);

        this.mark1Array = new MarkArray(byte_ar, offset + mark1ArrayOffset);
        this.mark2Array = new Mark2Array(byte_ar, offset + mark2ArrayOffset, this.markClassCount);

        byte_ar.offset = prev;
    }
}
