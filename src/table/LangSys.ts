// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";

export class LangSys {
    private lookupOrder: number;
    private reqFeatureIndex: number;
    private featureCount: number;
    private featureIndex: number[];

    /** Creates a new LangSys */
    constructor(byteArray: ByteArray) {
        this.lookupOrder = byteArray.readUnsignedShort();
        this.reqFeatureIndex = byteArray.readUnsignedShort();
        this.featureCount = byteArray.readUnsignedShort();
        this.featureIndex = new Array(this.featureCount);
        for (let i = 0; i < this.featureCount; i++) {
            this.featureIndex[i] = byteArray.readUnsignedShort();
        }
    }

    /**
     * Checks if a feature is indexed
     * @param n - The index to check
     * @returns True if the feature index exists, otherwise false
     */
    public isFeatureIndexed(n: number): boolean {
        for (let i = 0; i < this.featureCount; i++) {
            if (this.featureIndex[i] === n) {
                return true;
            }
        }
        return false;
    }
}
