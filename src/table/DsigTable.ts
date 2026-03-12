import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class DsigTable implements ITable {
    version: number;
    numSignatures: number;
    flags: number;
    signatures: { format: number; length: number; offset: number }[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUInt();
        this.numSignatures = byte_ar.readUnsignedShort();
        this.flags = byte_ar.readUnsignedShort();
        this.signatures = [];
        for (let i = 0; i < this.numSignatures; i++) {
            this.signatures.push({
                format: byte_ar.readUnsignedInt(),
                length: byte_ar.readUnsignedInt(),
                offset: byte_ar.readUnsignedInt()
            });
        }
    }

    getType(): number {
        return Table.DSIG;
    }
}
