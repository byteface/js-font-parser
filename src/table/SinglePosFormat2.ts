import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord, ValueRecordData } from './ValueRecord.js';

export class SinglePosFormat2 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat: number;
    values: ValueRecordData[] = [];

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.valueFormat = 0;
            byte_ar.offset = prev;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat = byte_ar.readUnsignedShort();
        const valueCount = byte_ar.readUnsignedShort();
        this.values = [];
        for (let i = 0; i < valueCount; i++) {
            this.values.push(ValueRecord.read(byte_ar, this.valueFormat));
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = prev;
    }

    getAdjustment(glyphId: number): ValueRecordData | null {
        if (!this.coverage) return null;
        const idx = this.coverage.findGlyph(glyphId);
        if (idx < 0 || idx >= this.values.length) return null;
        return this.values[idx];
    }
}
