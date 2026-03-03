import { ChainingSubstFormat3 } from "./ChainingSubstFormat3.js";
var ChainingSubst = /** @class */ (function () {
    function ChainingSubst() {
    }
    ChainingSubst.read = function (byte_ar, offset, gsub) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 3) {
            return new ChainingSubstFormat3(byte_ar, offset, gsub);
        }
        return null;
    };
    return ChainingSubst;
}());
export { ChainingSubst };
