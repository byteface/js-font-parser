import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';
var SinglePosFormat1 = /** @class */ (function () {
    function SinglePosFormat1(byte_ar, offset) {
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            this.valueFormat = 0;
            this.value = null;
            byte_ar.offset = prev;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat = byte_ar.readUnsignedShort();
        this.value = ValueRecord.read(byte_ar, this.valueFormat);
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = prev;
    }
    SinglePosFormat1.prototype.getAdjustment = function (glyphId) {
        if (!this.coverage)
            return null;
        var idx = this.coverage.findGlyph(glyphId);
        if (idx < 0)
            return null;
        return this.value;
    };
    return SinglePosFormat1;
}(LookupSubtable));
export { SinglePosFormat1 };
