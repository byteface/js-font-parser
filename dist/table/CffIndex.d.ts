import { ByteArray } from '../utils/ByteArray.js';
export declare class CffIndex {
    count: number;
    objects: Uint8Array[];
    constructor(count: number, objects: Uint8Array[]);
    static read(byte_ar: ByteArray, offset?: number): CffIndex;
    static readCff2(byte_ar: ByteArray, offset?: number): CffIndex;
    private static readWithCountSize;
}
