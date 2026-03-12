import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
type VdmxRatio = {
    bCharSet: number;
    xRatio: number;
    yStartRatio: number;
    yEndRatio: number;
};
type VdmxEntry = {
    yPelHeight: number;
    yMax: number;
    yMin: number;
};
type VdmxGroup = {
    recs: number;
    startsz: number;
    endsz: number;
    entries: VdmxEntry[];
};
export declare class VdmxTable implements ITable {
    version: number;
    numRecs: number;
    numRatios: number;
    ratios: VdmxRatio[];
    offsets: number[];
    groups: VdmxGroup[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    private readGroup;
    getType(): number;
}
export {};
