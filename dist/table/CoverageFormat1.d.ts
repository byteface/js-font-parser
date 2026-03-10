import { ByteArray } from "../utils/ByteArray.js";
import { ICoverage } from './ICoverage.js';
export declare class CoverageFormat1 implements ICoverage {
    private glyphCount;
    private glyphIds;
    constructor(byte_ar: ByteArray);
    getFormat(): number;
    findGlyph(glyphId: number): number;
}
