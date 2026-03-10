import { ByteArray } from '../utils/ByteArray.js';
import { LookupSubtable } from './LookupSubtable.js';
export declare class PairPosSubtable {
    static read(byte_ar: ByteArray, offset: number): LookupSubtable | null;
}
