// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';

export class KernSubtableFormat2 extends KernSubtable {
    private rowWidth: number;
    private leftClassTable: number;
    private rightClassTable: number;
    private array: number;

    /** Creates new KernSubtableFormat2 */
    constructor(byte_ar: ByteArray) {
        super();
        this.rowWidth = byte_ar.readUnsignedShort();
        this.leftClassTable = byte_ar.readUnsignedShort();
        this.rightClassTable = byte_ar.readUnsignedShort();
        this.array = byte_ar.readUnsignedShort();
    }

    override getKerningPairCount(): number {
        return 0;
    }

    override getKerningPair(_i: number): KerningPair | null {
        return null;
    }
}
