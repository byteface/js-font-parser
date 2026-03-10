import { ByteArray } from '../utils/ByteArray.js';
import { SinglePosFormat1 } from './SinglePosFormat1.js';
import { SinglePosFormat2 } from './SinglePosFormat2.js';
export declare class SinglePosSubtable {
    static read(byte_ar: ByteArray, offset: number): SinglePosFormat1 | SinglePosFormat2 | null;
}
