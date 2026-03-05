// UNTESTED
var LangSys = /** @class */ (function () {
    /** Creates a new LangSys */
    function LangSys(byteArray) {
        this.lookupOrder = byteArray.readUnsignedShort();
        this.reqFeatureIndex = byteArray.readUnsignedShort();
        this.featureCount = byteArray.readUnsignedShort();
        this.featureIndex = new Array(this.featureCount);
        for (var i = 0; i < this.featureCount; i++) {
            this.featureIndex[i] = byteArray.readUnsignedShort();
        }
    }
    /**
     * Checks if a feature is indexed
     * @param n - The index to check
     * @returns True if the feature index exists, otherwise false
     */
    LangSys.prototype.isFeatureIndexed = function (n) {
        for (var i = 0; i < this.featureCount; i++) {
            if (this.featureIndex[i] === n) {
                return true;
            }
        }
        return false;
    };
    LangSys.prototype.getRequiredFeatureIndex = function () {
        return this.reqFeatureIndex;
    };
    LangSys.prototype.getFeatureIndices = function () {
        return this.featureIndex.slice();
    };
    return LangSys;
}());
export { LangSys };
