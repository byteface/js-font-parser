import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';
export type MarkRecord = {
    markClass: number;
    anchor: Anchor | null;
};
export declare class MarkArray {
    markCount: number;
    marks: MarkRecord[];
    constructor(byte_ar: ByteArray, offset: number);
}
