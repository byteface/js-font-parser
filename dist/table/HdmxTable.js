import { Table } from "./Table.js";
export class HdmxTable {
    version;
    numRecords;
    sizeDeviceRecord;
    records;
    constructor(de, byte_ar) {
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
    getType() {
        return Table.hdmx;
    }
}
