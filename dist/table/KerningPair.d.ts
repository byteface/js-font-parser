import { ByteArray } from "../utils/ByteArray.js";
export declare class KerningPair {
    private left;
    private right;
    private value;
    constructor(byte_ar: ByteArray);
    getLeft(): number;
    getRight(): number;
    getValue(): number;
}
