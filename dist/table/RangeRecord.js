// UNTESTED
var RangeRecord = /** @class */ (function () {
    /** Creates new RangeRecord */
    function RangeRecord(byte_ar) {
        this.start = byte_ar.readUnsignedShort();
        this.end = byte_ar.readUnsignedShort();
        this.startCoverageIndex = byte_ar.readUnsignedShort();
    }
    RangeRecord.prototype.isInRange = function (glyphId) {
        return (this.start <= glyphId && glyphId <= this.end);
    };
    RangeRecord.prototype.getCoverageIndex = function (glyphId) {
        if (this.isInRange(glyphId)) {
            return this.startCoverageIndex + glyphId - this.start;
        }
        return -1;
    };
    return RangeRecord;
}());
export { RangeRecord };
