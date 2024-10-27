// UNTESTED
import { CoverageFormat1 } from './CoverageFormat1.js';
import { CoverageFormat2 } from './CoverageFormat2.js';
var Coverage = /** @class */ (function () {
    function Coverage() {
    }
    /**
     *
     * @param byte_ar
     * @return
     *
     */
    Coverage.read = function (byte_ar) {
        var c = null;
        var format = byte_ar.readUnsignedShort();
        if (format === 1) {
            c = new CoverageFormat1(byte_ar);
        }
        else if (format === 2) {
            c = new CoverageFormat2(byte_ar);
        }
        return c;
    };
    return Coverage;
}());
export { Coverage };
