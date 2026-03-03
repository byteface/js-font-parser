import { MultipleSubstFormat1 } from "./MultipleSubstFormat1.js";
var MultipleSubst = /** @class */ (function () {
    function MultipleSubst() {
    }
    MultipleSubst.read = function (byte_ar, offset) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1) {
            return new MultipleSubstFormat1(byte_ar, offset);
        }
        return null;
    };
    return MultipleSubst;
}());
export { MultipleSubst };
