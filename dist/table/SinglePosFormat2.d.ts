import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecordData } from './ValueRecord.js';
export declare class SinglePosFormat2 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat: number;
    values: ValueRecordData[];
    constructor(byte_ar: ByteArray, offset: number);
    getAdjustment(glyphId: number): ValueRecordData | null;
}
