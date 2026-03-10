// UNTESTED
export class LangSys {
    lookupOrder;
    reqFeatureIndex;
    featureCount;
    featureIndex;
    featureIndexSet;
    /** Creates a new LangSys */
    constructor(byteArray) {
        this.lookupOrder = byteArray.readUnsignedShort();
        this.reqFeatureIndex = byteArray.readUnsignedShort();
        this.featureCount = byteArray.readUnsignedShort();
        this.featureIndex = new Array(this.featureCount);
        for (let i = 0; i < this.featureCount; i++) {
            this.featureIndex[i] = byteArray.readUnsignedShort();
        }
        this.featureIndexSet = new Set(this.featureIndex);
    }
    /**
     * Checks if a feature is indexed
     * @param n - The index to check
     * @returns True if the feature index exists, otherwise false
     */
    isFeatureIndexed(n) {
        return this.featureIndexSet.has(n);
    }
    getRequiredFeatureIndex() {
        return this.reqFeatureIndex;
    }
    getFeatureIndices() {
        return this.featureIndex.slice();
    }
}
