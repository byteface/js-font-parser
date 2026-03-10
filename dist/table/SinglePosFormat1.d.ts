import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecordData } from './ValueRecord.js';
export declare class SinglePosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat: number;
    value: ValueRecordData | null;
    constructor(byte_ar: ByteArray, offset: number);
    getAdjustment(glyphId: number): ValueRecordData | null;
}
