import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class HdmxTable implements ITable {
    version: number;
    numRecords: number;
    sizeDeviceRecord: number;
    records: { pixelSize: number; maxWidth: number; widths: number[] }[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numRecords = byte_ar.readShort();
        this.sizeDeviceRecord = byte_ar.readInt();
        this.records = [];
        for (let i = 0; i < this.numRecords; i++) {
            const pixelSize = byte_ar.readUnsignedByte();
            const maxWidth = byte_ar.readUnsignedByte();
            const widths = Array.from(byte_ar.readBytes(Math.max(0, this.sizeDeviceRecord - 2)));
            this.records.push({ pixelSize, maxWidth, widths });
        }
    }

    getType(): number {
        return Table.hdmx;
    }
}
