import { Table } from "./Table.js";
export class HvarTable {
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.itemVariationStoreOffset = byte_ar.readUnsignedInt();
        this.advanceWidthMappingOffset = byte_ar.readUnsignedInt();
        this.leftSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.rightSideBearingMappingOffset = byte_ar.readUnsignedInt();
    }
    getType() {
        return Table.HVAR;
    }
}
