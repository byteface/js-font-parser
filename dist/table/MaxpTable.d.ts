import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class MaxpTable implements ITable {
    versionNumber: number;
    numGlyphs: number;
    maxPoints: number;
    maxContours: number;
    maxCompositePoints: number;
    maxCompositeContours: number;
    maxZones: number;
    maxTwilightPoints: number;
    maxStorage: number;
    maxFunctionDefs: number;
    maxInstructionDefs: number;
    maxStackElements: number;
    maxSizeOfInstructions: number;
    maxComponentElements: number;
    maxComponentDepth: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
