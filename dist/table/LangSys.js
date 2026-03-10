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
        this.featureIndexSet = new Set(this.featureIndex);
    }
    /**
     * Checks if a feature is indexed
     * @param n - The index to check
     * @returns True if the feature index exists, otherwise false
     */
    LangSys.prototype.isFeatureIndexed = function (n) {
        return this.featureIndexSet.has(n);
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
