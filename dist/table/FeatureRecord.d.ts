import { ByteArray } from "../utils/ByteArray.js";
export declare class FeatureRecord {
    private tag;
    private offset;
    constructor(byte_ar: ByteArray);
    getTag(): number;
    getOffset(): number;
}
