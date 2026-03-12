import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class HvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    itemVariationStoreOffset: number;
    advanceWidthMappingOffset: number;
    leftSideBearingMappingOffset: number;
    rightSideBearingMappingOffset: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.itemVariationStoreOffset = byte_ar.readUnsignedInt();
        this.advanceWidthMappingOffset = byte_ar.readUnsignedInt();
        this.leftSideBearingMappingOffset = byte_ar.readUnsignedInt();
        this.rightSideBearingMappingOffset = byte_ar.readUnsignedInt();
    }

    getType(): number {
        return Table.HVAR;
    }
}
