import { ByteArray } from "../utils/ByteArray.js";
import { Ligature } from "./Ligature.js";
export declare class LigatureSet {
    private ligatureCount;
    private ligatureOffsets;
    private ligatures;
    constructor(byteAr: ByteArray, offset: number);
    getLigatures(): Ligature[];
}
