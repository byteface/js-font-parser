import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class HdmxTable implements ITable {
    version: number;
    numRecords: number;
    sizeDeviceRecord: number;
    records: {
        pixelSize: number;
        maxWidth: number;
        widths: number[];
    }[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
