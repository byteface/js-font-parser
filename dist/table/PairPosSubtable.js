import { PairPosFormat1 } from './PairPosFormat1.js';
import { PairPosFormat2 } from './PairPosFormat2.js';
export class PairPosSubtable {
    static read(byte_ar, offset) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        byte_ar.offset = prev;
        if (format === 1)
            return new PairPosFormat1(byte_ar, offset);
        if (format === 2)
            return new PairPosFormat2(byte_ar, offset);
        return null;
    }
}
