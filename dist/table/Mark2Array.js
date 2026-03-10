import { Anchor } from './Anchor.js';
export class Mark2Array {
    mark2Count;
    records = [];
    constructor(byte_ar, offset, markClassCount) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.mark2Count = byte_ar.readUnsignedShort();
        const anchorOffsets = [];
        for (let i = 0; i < this.mark2Count; i++) {
            const offsets = [];
            for (let j = 0; j < markClassCount; j++) {
                offsets.push(byte_ar.readUnsignedShort());
            }
            anchorOffsets.push(offsets);
        }
        this.records = anchorOffsets.map(list => ({
            anchors: list.map(o => Anchor.read(byte_ar, offset + o))
        }));
        byte_ar.offset = prev;
    }
}
