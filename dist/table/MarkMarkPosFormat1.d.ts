import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { Mark2Array } from './Mark2Array.js';
export declare class MarkMarkPosFormat1 extends LookupSubtable {
    mark1Coverage: ICoverage | null;
    mark2Coverage: ICoverage | null;
    markClassCount: number;
    mark1Array: MarkArray | null;
    mark2Array: Mark2Array | null;
    constructor(byte_ar: ByteArray, offset: number);
}
