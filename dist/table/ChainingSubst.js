import { ChainingSubstFormat1 } from "./ChainingSubstFormat1.js";
import { ChainingSubstFormat2 } from "./ChainingSubstFormat2.js";
import { ChainingSubstFormat3 } from "./ChainingSubstFormat3.js";
var ChainingSubst = /** @class */ (function () {
    function ChainingSubst() {
    }
    ChainingSubst.read = function (byte_ar, offset, gsub) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1)
            return new ChainingSubstFormat1(byte_ar, offset, gsub);
        if (format === 2)
            return new ChainingSubstFormat2(byte_ar, offset, gsub);
        if (format === 3)
            return new ChainingSubstFormat3(byte_ar, offset, gsub);
        return null;
    };
    return ChainingSubst;
}());
export { ChainingSubst };
