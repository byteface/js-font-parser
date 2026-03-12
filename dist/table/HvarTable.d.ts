import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class HvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    itemVariationStoreOffset: number;
    advanceWidthMappingOffset: number;
    leftSideBearingMappingOffset: number;
    rightSideBearingMappingOffset: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
