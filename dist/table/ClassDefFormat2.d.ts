import { ByteArray } from "../utils/ByteArray.js";
import { ClassDef } from "./ClassDef.js";
export declare class ClassDefFormat2 extends ClassDef {
    private classRangeCount;
    private classRangeRecords;
    constructor(byte_ar: ByteArray);
    getFormat(): number;
    getGlyphClass(glyphId: number): number;
}
