import { ByteArray } from '../utils/ByteArray.js';
import { SinglePosFormat1 } from './SinglePosFormat1.js';
import { SinglePosFormat2 } from './SinglePosFormat2.js';

export class SinglePosSubtable {
    static read(byte_ar: ByteArray, offset: number): SinglePosFormat1 | SinglePosFormat2 | null {
        const format = byte_ar.dataView.getUint16(offset);
        if (format === 1) return new SinglePosFormat1(byte_ar, offset);
        if (format === 2) return new SinglePosFormat2(byte_ar, offset);
        return null;
    }
}
