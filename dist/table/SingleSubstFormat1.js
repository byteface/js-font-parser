// UNTESTED
import { Coverage } from './Coverage.js';
var SingleSubstFormat1 = /** @class */ (function () {
    function SingleSubstFormat1(byte_ar, offset) {
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.deltaGlyphID = byte_ar.readShort();
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }
    SingleSubstFormat1.prototype.getFormat = function () {
        return 1;
    };
    SingleSubstFormat1.prototype.substitute = function (glyphId) {
        if (this.coverage) {
            var i = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return glyphId + this.deltaGlyphID;
            }
        }
        return glyphId;
    };
    return SingleSubstFormat1;
}());
export { SingleSubstFormat1 };
