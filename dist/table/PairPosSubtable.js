import { PairPosFormat1 } from './PairPosFormat1.js';
import { PairPosFormat2 } from './PairPosFormat2.js';
var PairPosSubtable = /** @class */ (function () {
    function PairPosSubtable() {
    }
    PairPosSubtable.read = function (byte_ar, offset) {
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        byte_ar.offset = prev;
        if (format === 1)
            return new PairPosFormat1(byte_ar, offset);
        if (format === 2)
            return new PairPosFormat2(byte_ar, offset);
        return null;
    };
    return PairPosSubtable;
}());
export { PairPosSubtable };
