import { ByteArray } from "../utils/ByteArray.js";
export declare class Ligature {
    private ligGlyph;
    private compCount;
    private components;
    constructor(byteAr: ByteArray);
    getGlyphCount(): number;
    getLigatureGlyph(): number;
    getGlyphId(i: number): number;
    getComponents(): number[];
}
