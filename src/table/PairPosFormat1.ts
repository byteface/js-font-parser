import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord, ValueRecordData } from './ValueRecord.js';

export class PairPosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat1: number;
    valueFormat2: number;
    pairSets: Array<Map<number, { v1: ValueRecordData; v2: ValueRecordData }>> = [];

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;

        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            this.valueFormat1 = 0;
            this.valueFormat2 = 0;
            byte_ar.offset = prev;
            return;
        }

        const coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat1 = byte_ar.readUnsignedShort();
        this.valueFormat2 = byte_ar.readUnsignedShort();
        const pairSetCount = byte_ar.readUnsignedShort();
        const pairSetOffsets: number[] = [];
        for (let i = 0; i < pairSetCount; i++) {
            pairSetOffsets.push(byte_ar.readUnsignedShort());
        }

        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);

        this.pairSets = pairSetOffsets.map(pairOffset => {
            const map = new Map<number, { v1: ValueRecordData; v2: ValueRecordData }>();
            byte_ar.offset = offset + pairOffset;
            const pairValueCount = byte_ar.readUnsignedShort();
            for (let i = 0; i < pairValueCount; i++) {
                const secondGlyph = byte_ar.readUnsignedShort();
                const v1 = ValueRecord.read(byte_ar, this.valueFormat1);
                const v2 = ValueRecord.read(byte_ar, this.valueFormat2);
                map.set(secondGlyph, { v1, v2 });
            }
            return map;
        });

        byte_ar.offset = prev;
    }

    getKerning(leftGlyph: number, rightGlyph: number): number {
        if (!this.coverage) return 0;
        const index = this.coverage.findGlyph(leftGlyph);
        if (index < 0 || index >= this.pairSets.length) return 0;
        const map = this.pairSets[index];
        const pair = map.get(rightGlyph);
        return pair?.v1?.xAdvance ?? 0;
    }

    getPairValue(leftGlyph: number, rightGlyph: number): { v1: ValueRecordData; v2: ValueRecordData } | null {
        if (!this.coverage) return null;
        const index = this.coverage.findGlyph(leftGlyph);
        if (index < 0 || index >= this.pairSets.length) return null;
        const map = this.pairSets[index];
        return map.get(rightGlyph) ?? null;
    }
}
