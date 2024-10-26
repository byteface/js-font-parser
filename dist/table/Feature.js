// UNTESTED
var Feature = /** @class */ (function () {
    function Feature(byte_ar, offset) {
        byte_ar.offset = offset;
        this.featureParams = byte_ar.readUnsignedShort();
        this.lookupCount = byte_ar.readUnsignedShort();
        this.lookupListIndex = new Array(this.lookupCount);
        for (var i = 0; i < this.lookupCount; i++) {
            this.lookupListIndex[i] = byte_ar.readUnsignedShort();
        }
    }
    Feature.prototype.getLookupCount = function () {
        return this.lookupCount;
    };
    Feature.prototype.getLookupListIndex = function (i) {
        return this.lookupListIndex[i];
    };
    return Feature;
}());
export { Feature };
