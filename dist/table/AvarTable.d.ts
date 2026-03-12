import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
type AvarMap = {
    from: number;
    to: number;
};
export declare class AvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    reserved: number;
    axisCount: number;
    segmentMaps: AvarMap[][];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    mapCoord(axisIndex: number, normalized: number): number;
    getType(): number;
}
export {};
