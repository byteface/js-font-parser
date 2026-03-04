import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';
var SinglePosFormat2 = /** @class */ (function () {
    function SinglePosFormat2(byte_ar, offset) {
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.valueFormat = 0;
            byte_ar.offset = prev;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        this.valueFormat = byte_ar.readUnsignedShort();
        var valueCount = byte_ar.readUnsignedShort();
        this.values = [];
        for (var i = 0; i < valueCount; i++) {
            this.values.push(ValueRecord.read(byte_ar, this.valueFormat));
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = prev;
    }
    SinglePosFormat2.prototype.getAdjustment = function (glyphId) {
        if (!this.coverage)
            return null;
        var idx = this.coverage.findGlyph(glyphId);
        if (idx < 0 || idx >= this.values.length)
            return null;
        return this.values[idx];
    };
    return SinglePosFormat2;
}(LookupSubtable));
export { SinglePosFormat2 };
