import { Table } from "./Table.js";
import { BaseTable } from "./BaseTable.js";
export class JstfTable extends BaseTable {
    version;
    scriptCount;
    scriptRecords;
    constructor(de, byte_ar) {
        super();
        byte_ar.offset = de.offset;
        this.version = byte_ar.readFixed();
        this.scriptCount = byte_ar.readUnsignedShort();
        this.scriptRecords = [];
        for (let i = 0; i < this.scriptCount; i++) {
            this.scriptRecords.push({
                tag: this.readTag(byte_ar),
                offset: byte_ar.readUnsignedShort()
            });
        }
    }
    getType() {
        return Table.JSTF;
    }
}
