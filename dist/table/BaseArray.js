import { Anchor } from './Anchor.js';
export class BaseArray {
    baseCount;
    baseRecords = [];
    constructor(byte_ar, offset, markClassCount) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.baseCount = byte_ar.readUnsignedShort();
        const anchorOffsets = [];
        for (let i = 0; i < this.baseCount; i++) {
            const offsets = [];
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
