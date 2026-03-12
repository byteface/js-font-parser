import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export type MvarRecord = {
    tag: string;
    deltaSetOuterIndex: number;
    deltaSetInnerIndex: number;
};
export declare class MvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    reserved: number;
    valueRecordSize: number;
    valueRecordCount: number;
    itemVariationStoreOffset: number;
    records: MvarRecord[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
