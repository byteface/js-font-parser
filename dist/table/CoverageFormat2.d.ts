import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
export declare class CoverageFormat2 implements ICoverage {
    private rangeCount;
    private rangeRecords;
    constructor(byte_ar: ByteArray);
    getFormat(): number;
    findGlyph(glyphId: number): number;
}
