import { SinglePosFormat1 } from './SinglePosFormat1.js';
import { SinglePosFormat2 } from './SinglePosFormat2.js';
var SinglePosSubtable = /** @class */ (function () {
    function SinglePosSubtable() {
    }
    SinglePosSubtable.read = function (byte_ar, offset) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1)
            return new SinglePosFormat1(byte_ar, offset);
        if (format === 2)
            return new SinglePosFormat2(byte_ar, offset);
        return null;
    };
    return SinglePosSubtable;
}());
export { SinglePosSubtable };
