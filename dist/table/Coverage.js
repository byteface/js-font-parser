// UNTESTED
import { CoverageFormat1 } from './CoverageFormat1';
import { CoverageFormat2 } from './CoverageFormat2';
var Coverage = /** @class */ (function () {
    function Coverage() {
    }
    Coverage.prototype.getFormat = function () {
        return -1;
    };
    /**
     * @param glyphId The ID of the glyph to find.
     * @return The index of the glyph within the coverage, or -1 if the glyph
     * can't be found.
     */
    Coverage.prototype.findGlyph = function (glyphId) {
        return -1;
    };
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
