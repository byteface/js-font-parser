// UNTESTED
import { Coverage } from './Coverage.js';
var SingleSubstFormat2 = /** @class */ (function () {
    function SingleSubstFormat2(byte_ar, offset) {
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.glyphCount = byte_ar.readUnsignedShort();
        this.substitutes = new Array(this.glyphCount);
        for (var i = 0; i < this.glyphCount; i++) {
            this.substitutes[i] = byte_ar.readUnsignedShort();
        }
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }
    SingleSubstFormat2.prototype.getFormat = function () {
        return 2;
    };
    SingleSubstFormat2.prototype.substitute = function (glyphId) {
        if (this.coverage) {
            var i = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return this.substitutes[i];
            }
        }
        return glyphId;
    };
    return SingleSubstFormat2;
}());
export { SingleSubstFormat2 };
