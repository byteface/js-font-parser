import { Anchor } from './Anchor.js';
export class MarkArray {
    markCount;
    marks = [];
    constructor(byte_ar, offset) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.markCount = byte_ar.readUnsignedShort();
        const markClassAndOffsets = [];
        for (let i = 0; i < this.markCount; i++) {
            const markClass = byte_ar.readUnsignedShort();
            const anchorOffset = byte_ar.readUnsignedShort();
            markClassAndOffsets.push({ markClass, anchorOffset });
        }
        this.marks = markClassAndOffsets.map(entry => ({
            markClass: entry.markClass,
            anchor: Anchor.read(byte_ar, offset + entry.anchorOffset)
        }));
        byte_ar.offset = prev;
    }
}
