import { ByteArray } from "../utils/ByteArray.js";
export declare class NameRecord {
    platformId: number;
    encodingId: number;
    languageId: number;
    nameId: number;
    stringLength: number;
    stringOffset: number;
    record: string;
    constructor(byte_ar: ByteArray);
    loadString(byte_ar: ByteArray, stringStorageOffset: number): void;
}
