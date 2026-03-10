import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { BaseArray } from './BaseArray.js';
export declare class MarkBasePosFormat1 extends LookupSubtable {
    markCoverage: ICoverage | null;
    baseCoverage: ICoverage | null;
    markClassCount: number;
    markArray: MarkArray | null;
    baseArray: BaseArray | null;
    constructor(byte_ar: ByteArray, offset: number);
}
