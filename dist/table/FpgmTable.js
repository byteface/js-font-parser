import { Program } from "./Program.js";
import { Table } from "./Table.js";
export class FpgmTable extends Program {
    constructor(de, byte_ar) {
        super();
        byte_ar.offset = de.offset;
        this.readInstructions(byte_ar, de.length);
    }
    getType() {
        return Table.fpgm;
    }
}
