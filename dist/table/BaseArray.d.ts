import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';
export type BaseRecord = {
    anchors: Array<Anchor | null>;
};
export declare class BaseArray {
    baseCount: number;
    baseRecords: BaseRecord[];
    constructor(byte_ar: ByteArray, offset: number, markClassCount: number);
}
