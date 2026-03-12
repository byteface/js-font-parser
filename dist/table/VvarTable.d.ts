import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class VvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    itemVariationStoreOffset: number;
    advanceHeightMappingOffset: number;
    topSideBearingMappingOffset: number;
    bottomSideBearingMappingOffset: number;
    verticalOriginMappingOffset: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
