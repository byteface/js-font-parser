import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';

export type LigatureAttach = {
    components: Array<Array<Anchor | null>>;
};

export class LigatureArray {
    ligatureCount: number;
    ligatures: LigatureAttach[] = [];

    constructor(byte_ar: ByteArray, offset: number, markClassCount: number) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.ligatureCount = byte_ar.readUnsignedShort();
        const offsets: number[] = [];
        for (let i = 0; i < this.ligatureCount; i++) {
            offsets.push(byte_ar.readUnsignedShort());
        }
        this.ligatures = offsets.map(off => {
            const ligOffset = offset + off;
            byte_ar.offset = ligOffset;
            const componentCount = byte_ar.readUnsignedShort();
            const components: Array<Array<Anchor | null>> = [];
            for (let c = 0; c < componentCount; c++) {
                const anchors: Array<Anchor | null> = [];
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
