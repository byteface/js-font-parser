import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
export declare class AlternateSubstFormat1 extends LookupSubtable {
    private coverage;
    private alternates;
    constructor(byte_ar: ByteArray, offset: number);
    substitute(glyphId: number): number | null;
    applyAt(glyphs: number[], index: number): number[] | null;
    applyToGlyphs(glyphs: number[]): number[];
}
