import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";
import { BaseTable } from "./BaseTable.js";

export class JstfTable extends BaseTable implements ITable {
    version: number;
    scriptCount: number;
    scriptRecords: { tag: string; offset: number }[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
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

    getType(): number {
        return Table.JSTF;
    }
}
