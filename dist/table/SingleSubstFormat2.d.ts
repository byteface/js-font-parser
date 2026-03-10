import { ByteArray } from '../utils/ByteArray.js';
import { ISingleSubst } from './ISingleSubst.js';
export declare class SingleSubstFormat2 implements ISingleSubst {
    private coverageOffset;
    private glyphCount;
    private substitutes;
    private coverage;
    constructor(byte_ar: ByteArray, offset: number);
    getFormat(): number;
    substitute(glyphId: number): number;
}
