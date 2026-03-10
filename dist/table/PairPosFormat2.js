import { Coverage } from './Coverage.js';
import { ClassDefReader } from './ClassDefReader.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';
export class PairPosFormat2 extends LookupSubtable {
    coverage;
    valueFormat1;
    valueFormat2;
    classDef1;
    classDef2;
    class1Count;
    class2Count;
    classRecords = [];
    constructor(byte_ar, offset) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.valueFormat1 = 0;
            this.valueFormat2 = 0;
            this.classDef1 = null;
            this.classDef2 = null;
            this.class1Count = 0;
            this.class2Count = 0;
            byte_ar.offset = prev;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat1 = byte_ar.readUnsignedShort();
        this.valueFormat2 = byte_ar.readUnsignedShort();
        const classDef1Offset = byte_ar.readUnsignedShort();
        const classDef2Offset = byte_ar.readUnsignedShort();
        this.class1Count = byte_ar.readUnsignedShort();
        this.class2Count = byte_ar.readUnsignedShort();
        const classMatrixOffset = byte_ar.offset;
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + classDef1Offset;
        this.classDef1 = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + classDef2Offset;
        this.classDef2 = ClassDefReader.read(byte_ar);
        this.classRecords = [];
        try {
            byte_ar.offset = classMatrixOffset;
            for (let i = 0; i < this.class1Count; i++) {
                const row = [];
                for (let j = 0; j < this.class2Count; j++) {
                    const v1 = ValueRecord.read(byte_ar, this.valueFormat1);
                    const v2 = ValueRecord.read(byte_ar, this.valueFormat2);
                    row.push({ v1, v2 });
                }
                this.classRecords.push(row);
            }
        }
        catch {
            // Some fonts contain inconsistent PairPosFormat2 class matrix lengths.
            // Keep parsing alive and treat this subtable as empty.
            this.classRecords = [];
        }
        byte_ar.offset = prev;
    }
    getKerning(leftGlyph, rightGlyph) {
        if (!this.coverage || !this.classDef1 || !this.classDef2)
            return 0;
        const index = this.coverage.findGlyph(leftGlyph);
        if (index < 0)
            return 0;
        const c1 = this.classDef1.getGlyphClass?.(leftGlyph) ?? 0;
        const c2 = this.classDef2.getGlyphClass?.(rightGlyph) ?? 0;
        if (c1 < 0 || c2 < 0 || c1 >= this.classRecords.length || c2 >= this.classRecords[c1].length)
            return 0;
        return this.classRecords[c1][c2]?.v1?.xAdvance ?? 0;
    }
    getPairValue(leftGlyph, rightGlyph) {
        if (!this.coverage || !this.classDef1 || !this.classDef2)
            return null;
        const index = this.coverage.findGlyph(leftGlyph);
        if (index < 0)
            return null;
        const c1 = this.classDef1.getGlyphClass?.(leftGlyph) ?? 0;
        const c2 = this.classDef2.getGlyphClass?.(rightGlyph) ?? 0;
        if (c1 < 0 || c2 < 0 || c1 >= this.classRecords.length || c2 >= this.classRecords[c1].length)
            return null;
        return this.classRecords[c1][c2] ?? null;
    }
}
