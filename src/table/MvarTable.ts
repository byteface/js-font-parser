import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

type MvarRecord = { tag: string; deltaSetOuterIndex: number; deltaSetInnerIndex: number };

export class MvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    reserved: number;
    valueRecordSize: number;
    valueRecordCount: number;
    itemVariationStoreOffset: number;
    records: MvarRecord[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.reserved = byte_ar.readUnsignedShort();
        this.valueRecordSize = byte_ar.readUnsignedShort();
        this.valueRecordCount = byte_ar.readUnsignedShort();
        this.itemVariationStoreOffset = byte_ar.readUnsignedShort();
        this.records = [];
        for (let i = 0; i < this.valueRecordCount; i++) {
            this.records.push({
                tag: String.fromCharCode(
                    byte_ar.readUnsignedByte(),
                    byte_ar.readUnsignedByte(),
                    byte_ar.readUnsignedByte(),
                    byte_ar.readUnsignedByte()
                ),
                deltaSetOuterIndex: byte_ar.readUnsignedShort(),
                deltaSetInnerIndex: byte_ar.readUnsignedShort()
            });
            const padding = Math.max(0, this.valueRecordSize - 8);
            if (padding) byte_ar.readBytes(padding);
        }
    }

    getType(): number {
        return Table.MVAR;
    }
}
