import { ContextSubstFormat3 } from "./ContextSubstFormat3.js";
var ContextSubst = /** @class */ (function () {
    function ContextSubst() {
    }
    ContextSubst.read = function (byte_ar, offset, gsub) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 3) {
            return new ContextSubstFormat3(byte_ar, offset, gsub);
        }
        return null;
    };
    return ContextSubst;
}());
export { ContextSubst };
