import { ByteArray } from "../utils/ByteArray.js";
import { ClassDef } from "./ClassDef.js";
import { RangeRecord } from "./RangeRecord.js";

export class ClassDefFormat2 extends ClassDef {
    private classRangeCount: number;
    private classRangeRecords: RangeRecord[];

    constructor(byte_ar: ByteArray) {
        super();
        this.classRangeCount = byte_ar.readUnsignedShort();
        this.classRangeRecords = new Array(this.classRangeCount);

        for (let i = 0; i < this.classRangeCount; i++) {
            this.classRangeRecords[i] = new RangeRecord(byte_ar);
        }
    }

    public override getFormat(): number {
        return 2;
    }
}
