import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';
export declare class KernSubtableFormat2 extends KernSubtable {
    private rowWidth;
    private leftClassTable;
    private rightClassTable;
    private array;
    /** Creates new KernSubtableFormat2 */
    constructor(byte_ar: ByteArray);
    getKerningPairCount(): number;
    getKerningPair(_i: number): KerningPair | null;
}
