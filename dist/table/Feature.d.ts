import { ByteArray } from "../utils/ByteArray.js";
export declare class Feature {
    private featureParams;
    private lookupCount;
    private lookupListIndex;
    constructor(byte_ar: ByteArray, offset: number);
    getLookupCount(): number;
    getLookupListIndex(i: number): number;
}
