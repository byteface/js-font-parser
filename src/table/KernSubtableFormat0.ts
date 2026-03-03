// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';

export class KernSubtableFormat0 extends KernSubtable {
    private nPairs: number;
    private searchRange: number;
    private entrySelector: number;
    private rangeShift: number;
    private kerningPairs: KerningPair[];
    private pairMap: Map<number, number>;

    constructor(byte_ar: ByteArray) {
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

    override getKerningPairCount(): number {
        return this.nPairs;
    }

    override getKerningPair(i: number): KerningPair | null {
        return this.kerningPairs[i] ?? null;
    }

    getKerningValue(leftGlyph: number, rightGlyph: number): number {
        const key = (leftGlyph << 16) | rightGlyph;
        return this.pairMap.get(key) ?? 0;
    }
}
