import { ByteArray } from '../utils/ByteArray.js';
export declare class Anchor {
    format: number;
    x: number;
    y: number;
    anchorPoint?: number;
    constructor(format: number, x: number, y: number, anchorPoint?: number);
    static read(byte_ar: ByteArray, offset: number): Anchor | null;
}
