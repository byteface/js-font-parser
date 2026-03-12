import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class VvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    itemVariationStoreOffset: number;
    advanceHeightMappingOffset: number;
    topSideBearingMappingOffset: number;
    bottomSideBearingMappingOffset: number;
    verticalOriginMappingOffset: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.itemVariationStoreOffset = byte_ar.readUnsignedInt();
        this.advanceHeightMappingOffset = byte_ar.readUnsignedInt();
        this.topSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.bottomSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.verticalOriginMappingOffset = byte_ar.readUnsignedInt();
    }

    getType(): number {
        return Table.VVAR;
    }
}
