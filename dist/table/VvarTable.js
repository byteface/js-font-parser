import { Table } from "./Table.js";
export class VvarTable {
    majorVersion;
    minorVersion;
    itemVariationStoreOffset;
    advanceHeightMappingOffset;
    topSideBearingMappingOffset;
    bottomSideBearingMappingOffset;
    verticalOriginMappingOffset;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.itemVariationStoreOffset = byte_ar.readUnsignedInt();
        this.advanceHeightMappingOffset = byte_ar.readUnsignedInt();
        this.topSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.bottomSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.verticalOriginMappingOffset = byte_ar.readUnsignedInt();
    }
    getType() {
        return Table.VVAR;
    }
}
