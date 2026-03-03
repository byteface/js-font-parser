import { AlternateSubstFormat1 } from "./AlternateSubstFormat1.js";
var AlternateSubst = /** @class */ (function () {
    function AlternateSubst() {
    }
    AlternateSubst.read = function (byte_ar, offset) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1) {
            return new AlternateSubstFormat1(byte_ar, offset);
        }
        return null;
    };
    return AlternateSubst;
}());
export { AlternateSubst };
