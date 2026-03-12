import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class LtshTable implements ITable {
    version: number;
    numGlyphs: number;
    yPels: number[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numGlyphs = byte_ar.readUnsignedShort();
        this.yPels = [];
        for (let i = 0; i < this.numGlyphs; i++) this.yPels.push(byte_ar.readUnsignedByte());
    }

    getType(): number {
        return Table.LTSH;
    }
}
