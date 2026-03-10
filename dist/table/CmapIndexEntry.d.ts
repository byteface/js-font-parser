import { ByteArray } from "../utils/ByteArray.js";
export declare class CmapIndexEntry {
    platformId: number;
    encodingId: number;
    offset: number;
    constructor(byteArray: ByteArray);
    toString(): string;
}
