import { ByteArray } from "../utils/ByteArray.js";
import { ClassDef } from "./ClassDef.js";
export declare class ClassDefFormat1 extends ClassDef {
    private startGlyph;
    private glyphCount;
    private classValues;
    constructor(byte_ar: ByteArray);
    getFormat(): number;
    getGlyphClass(glyphId: number): number;
}
