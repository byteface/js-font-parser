import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecordData } from './ValueRecord.js';
export declare class PairPosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    valueFormat1: number;
    valueFormat2: number;
    pairSets: Array<Map<number, {
        v1: ValueRecordData;
        v2: ValueRecordData;
    }>>;
    constructor(byte_ar: ByteArray, offset: number);
    getKerning(leftGlyph: number, rightGlyph: number): number;
    getPairValue(leftGlyph: number, rightGlyph: number): {
        v1: ValueRecordData;
        v2: ValueRecordData;
    } | null;
}
