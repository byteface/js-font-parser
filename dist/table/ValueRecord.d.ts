import { ByteArray } from '../utils/ByteArray.js';
export type ValueRecordData = {
    xPlacement?: number;
    yPlacement?: number;
    xAdvance?: number;
    yAdvance?: number;
};
export declare class ValueRecord {
    static read(byte_ar: ByteArray, valueFormat: number): ValueRecordData;
}
