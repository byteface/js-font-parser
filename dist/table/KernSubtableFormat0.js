// UNTESTED
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';
export class KernSubtableFormat0 extends KernSubtable {
    nPairs;
    searchRange;
    entrySelector;
    rangeShift;
    kerningPairs;
    pairMap;
    constructor(byte_ar) {
        super();
        this.nPairs = byte_ar.readUnsignedShort();
        this.searchRange = byte_ar.readUnsignedShort();
        this.entrySelector = byte_ar.readUnsignedShort();
        this.rangeShift = byte_ar.readUnsignedShort();
        this.kerningPairs = Array.from({ length: this.nPairs }, () => new KerningPair(byte_ar));
        this.pairMap = new Map();
        for (const pair of this.kerningPairs) {
            const key = (pair.getLeft() << 16) | pair.getRight();
            this.pairMap.set(key, pair.getValue());
        }
    }
    getKerningPairCount() {
        return this.nPairs;
    }
    getKerningPair(i) {
        return this.kerningPairs[i] ?? null;
    }
    getKerningValue(leftGlyph, rightGlyph) {
        const key = (leftGlyph << 16) | rightGlyph;
        return this.pairMap.get(key) ?? 0;
    }
}
