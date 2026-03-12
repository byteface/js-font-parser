import { Table } from "./Table.js";
export class MvarTable {
    majorVersion;
    minorVersion;
    reserved;
    valueRecordSize;
    valueRecordCount;
    itemVariationStoreOffset;
    records;
    constructor(de, byte_ar) {
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
                tag: String.fromCharCode(byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte()),
                deltaSetOuterIndex: byte_ar.readUnsignedShort(),
                deltaSetInnerIndex: byte_ar.readUnsignedShort()
            });
            const padding = Math.max(0, this.valueRecordSize - 8);
            if (padding)
                byte_ar.readBytes(padding);
        }
    }
    getType() {
        return Table.MVAR;
    }
}
