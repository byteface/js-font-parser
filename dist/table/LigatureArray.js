import { Anchor } from './Anchor.js';
export class LigatureArray {
    ligatureCount;
    ligatures = [];
    constructor(byte_ar, offset, markClassCount) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.ligatureCount = byte_ar.readUnsignedShort();
        const offsets = [];
        for (let i = 0; i < this.ligatureCount; i++) {
            offsets.push(byte_ar.readUnsignedShort());
        }
        this.ligatures = offsets.map(off => {
            const ligOffset = offset + off;
            byte_ar.offset = ligOffset;
            const componentCount = byte_ar.readUnsignedShort();
            const components = [];
            for (let c = 0; c < componentCount; c++) {
                const anchors = [];
                for (let m = 0; m < markClassCount; m++) {
                    const anchorOffset = byte_ar.readUnsignedShort();
                    anchors.push(Anchor.read(byte_ar, ligOffset + anchorOffset));
                }
                components.push(anchors);
            }
            return { components };
        });
        byte_ar.offset = prev;
    }
}
