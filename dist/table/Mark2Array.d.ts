import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';
export type Mark2Record = {
    anchors: Array<Anchor | null>;
};
export declare class Mark2Array {
    mark2Count: number;
    records: Mark2Record[];
    constructor(byte_ar: ByteArray, offset: number, markClassCount: number);
}
