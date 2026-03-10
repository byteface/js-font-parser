import { ByteArray } from "../utils/ByteArray.js";
export declare class LangSys {
    private lookupOrder;
    private reqFeatureIndex;
    private featureCount;
    private featureIndex;
    private featureIndexSet;
    /** Creates a new LangSys */
    constructor(byteArray: ByteArray);
    /**
     * Checks if a feature is indexed
     * @param n - The index to check
     * @returns True if the feature index exists, otherwise false
     */
    isFeatureIndexed(n: number): boolean;
    getRequiredFeatureIndex(): number;
    getFeatureIndices(): number[];
}
