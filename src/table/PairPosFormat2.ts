import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { ClassDef } from './ClassDef.js';
import { ClassDefReader } from './ClassDefReader.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';

export class PairPosFormat2 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat1: number;
    valueFormat2: number;
    classDef1: ClassDef | null;
    classDef2: ClassDef | null;
    class1Count: number;
    class2Count: number;
    classRecords: number[][] = [];

    constructor(byte_ar: ByteArray, offset: number) {
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

        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);

        byte_ar.offset = offset + classDef1Offset;
        this.classDef1 = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + classDef2Offset;
        this.classDef2 = ClassDefReader.read(byte_ar);

        this.classRecords = [];
        for (let i = 0; i < this.class1Count; i++) {
            const row: number[] = [];
            for (let j = 0; j < this.class2Count; j++) {
                const v1 = ValueRecord.read(byte_ar, this.valueFormat1);
                ValueRecord.read(byte_ar, this.valueFormat2);
                row.push(v1.xAdvance ?? 0);
            }
            this.classRecords.push(row);
        }

        byte_ar.offset = prev;
    }

    getKerning(leftGlyph: number, rightGlyph: number): number {
        if (!this.coverage || !this.classDef1 || !this.classDef2) return 0;
        const index = this.coverage.findGlyph(leftGlyph);
        if (index < 0) return 0;
        const c1 = (this.classDef1 as any).getGlyphClass?.(leftGlyph) ?? 0;
        const c2 = (this.classDef2 as any).getGlyphClass?.(rightGlyph) ?? 0;
        if (c1 < 0 || c2 < 0 || c1 >= this.classRecords.length || c2 >= this.classRecords[c1].length) return 0;
        return this.classRecords[c1][c2] ?? 0;
    }
}
