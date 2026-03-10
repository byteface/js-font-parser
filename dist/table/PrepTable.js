// UNTESTED
import { Program } from './Program.js';
import { Table } from './Table.js';
export class PrepTable extends Program {
    constructor(de, byte_ar) {
        super();
        byte_ar.seek(de.offset); // TODO
        this.readInstructions(byte_ar, de.length);
    }
    getType() {
        return Table.prep;
    }
}
