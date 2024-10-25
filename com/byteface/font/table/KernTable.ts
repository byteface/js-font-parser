import { ByteArray } from "../utils/ByteArray.js";

import { Table } from "./Table.js";

export class KernTable {
    version: number;
    nTables: number;
    tables: KernSubtable[];

    /** Creates new KernTable */
    constructor(de: any, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.nTables = byte_ar.readUnsignedShort();
        this.tables = new Array<KernSubtable>(this.nTables);

        for (let i = 0; i < this.nTables; i++) {
            this.tables[i] = KernSubtable.read(byte_ar);
        }
    }

    getSubtableCount(): number {
        return this.nTables;
    }

    getSubtable(i: number): KernSubtable {
        return this.tables[i];
    }

    getType(): number {
        return Table.kern;
    }
}
