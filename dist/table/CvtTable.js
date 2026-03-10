import { Table } from "./Table.js";
export class CvtTable {
    values;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        const len = Math.floor(de.length / 2);
        this.values = new Array(len);
        for (let i = 0; i < len; i++) {
            this.values[i] = byte_ar.readShort();
        }
    }
    getType() {
        return Table.cvt;
    }
    getValues() {
        return this.values;
    }
}
