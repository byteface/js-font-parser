// UNTESTED
// import { Coverage } from './Coverage.js';
import { RangeRecord } from './RangeRecord.js';
var CoverageFormat2 = /** @class */ (function () {
    function CoverageFormat2(byte_ar) {
        this.rangeCount = byte_ar.readUnsignedShort();
        this.rangeRecords = new Array(this.rangeCount);
        for (var i = 0; i < this.rangeCount; i++) {
            this.rangeRecords[i] = new RangeRecord(byte_ar);
        }
    }
    CoverageFormat2.prototype.getFormat = function () {
        return 2;
    };
    CoverageFormat2.prototype.findGlyph = function (glyphId) {
        for (var i = 0; i < this.rangeCount; i++) {
            var n = this.rangeRecords[i].getCoverageIndex(glyphId);
            if (n > -1) {
                return n;
            }
        }
        return -1;
    };
    return CoverageFormat2;
}());
export { CoverageFormat2 };
