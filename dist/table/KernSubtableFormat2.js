// UNTESTED
import { KernSubtable } from './KernSubtable.js';
export class KernSubtableFormat2 extends KernSubtable {
    rowWidth;
    leftClassTable;
    rightClassTable;
    array;
    /** Creates new KernSubtableFormat2 */
    constructor(byte_ar) {
        super();
        this.rowWidth = byte_ar.readUnsignedShort();
        this.leftClassTable = byte_ar.readUnsignedShort();
        this.rightClassTable = byte_ar.readUnsignedShort();
        this.array = byte_ar.readUnsignedShort();
    }
    getKerningPairCount() {
        return 0;
    }
    getKerningPair(i) {
        return null;
    }
}
