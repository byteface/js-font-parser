import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord, ValueRecordData } from './ValueRecord.js';

export class SinglePosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat: number;
    value: ValueRecordData | null;

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            this.valueFormat = 0;
            this.value = null;
            byte_ar.offset = prev;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat = byte_ar.readUnsignedShort();
        this.value = ValueRecord.read(byte_ar, this.valueFormat);
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = prev;
    }

    getAdjustment(glyphId: number): ValueRecordData | null {
        if (!this.coverage) return null;
        const idx = this.coverage.findGlyph(glyphId);
        if (idx < 0) return null;
        return this.value;
    }
}
