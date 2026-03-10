import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';
export declare class KernSubtableFormat0 extends KernSubtable {
    private nPairs;
    private searchRange;
    private entrySelector;
    private rangeShift;
    private kerningPairs;
    private pairMap;
    constructor(byte_ar: ByteArray);
    getKerningPairCount(): number;
    getKerningPair(i: number): KerningPair | null;
    getKerningValue(leftGlyph: number, rightGlyph: number): number;
}
