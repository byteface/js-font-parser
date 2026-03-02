import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';

export type BaseRecord = {
    anchors: Array<Anchor | null>;
};

export class BaseArray {
    baseCount: number;
    baseRecords: BaseRecord[] = [];

    constructor(byte_ar: ByteArray, offset: number, markClassCount: number) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.baseCount = byte_ar.readUnsignedShort();
        const anchorOffsets: number[][] = [];
        for (let i = 0; i < this.baseCount; i++) {
            const offsets: number[] = [];
            for (let j = 0; j < markClassCount; j++) {
                offsets.push(byte_ar.readUnsignedShort());
            }
            anchorOffsets.push(offsets);
        }
        this.baseRecords = anchorOffsets.map(list => ({
            anchors: list.map(o => Anchor.read(byte_ar, offset + o))
        }));
        byte_ar.offset = prev;
    }
}
