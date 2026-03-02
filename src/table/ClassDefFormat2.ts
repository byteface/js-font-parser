import { ByteArray } from "../utils/ByteArray.js";
import { ClassDef } from "./ClassDef.js";
type ClassRangeRecord = { start: number; end: number; classValue: number };

export class ClassDefFormat2 extends ClassDef {
    private classRangeCount: number;
    private classRangeRecords: ClassRangeRecord[];

    constructor(byte_ar: ByteArray) {
        super();
        this.classRangeCount = byte_ar.readUnsignedShort();
        this.classRangeRecords = new Array(this.classRangeCount);

        for (let i = 0; i < this.classRangeCount; i++) {
            const start = byte_ar.readUnsignedShort();
            const end = byte_ar.readUnsignedShort();
            const classValue = byte_ar.readUnsignedShort();
            this.classRangeRecords[i] = { start, end, classValue };
        }
    }

    public override getFormat(): number {
        return 2;
    }

    public override getGlyphClass(glyphId: number): number {
        for (const record of this.classRangeRecords) {
            if (glyphId >= record.start && glyphId <= record.end) {
                return record.classValue;
            }
        }
        return 0;
    }
}
