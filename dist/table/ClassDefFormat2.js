import { ClassDef } from "./ClassDef.js";
export class ClassDefFormat2 extends ClassDef {
    classRangeCount;
    classRangeRecords;
    constructor(byte_ar) {
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
    getFormat() {
        return 2;
    }
    getGlyphClass(glyphId) {
        for (const record of this.classRangeRecords) {
            if (glyphId >= record.start && glyphId <= record.end) {
                return record.classValue;
            }
        }
        return 0;
    }
}
