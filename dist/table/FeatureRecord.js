// UNTESTED
var FeatureRecord = /** @class */ (function () {
    function FeatureRecord(byte_ar) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
    FeatureRecord.prototype.getTag = function () {
        return this.tag;
    };
    FeatureRecord.prototype.getOffset = function () {
        return this.offset;
    };
    return FeatureRecord;
}());
export { FeatureRecord };
