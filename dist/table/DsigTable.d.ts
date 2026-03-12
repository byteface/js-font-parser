import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class DsigTable implements ITable {
    version: number;
    numSignatures: number;
    flags: number;
    signatures: {
        format: number;
        length: number;
        offset: number;
    }[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
