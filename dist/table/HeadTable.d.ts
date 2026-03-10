import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class HeadTable implements ITable {
    versionNumber: number;
    fontRevision: number;
    checkSumAdjustment: number;
    magicNumber: number;
    flags: number;
    unitsPerEm: number;
    created: number;
    modified: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    macStyle: number;
    lowestRecPPEM: number;
    fontDirectionHint: number;
    indexToLocFormat: number;
    glyphDataFormat: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    /**
     * TODO - put this on my bytearray class!!
     * Reads a long value from the byte array.
     * @param b The byte array.
     * @return The long value.
     */
    readLong(b: ByteArray): number;
    getType(): number;
    toString(): string;
}
