import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class RawTable implements ITable {
    private readonly type;
    private readonly offset;
    private readonly length;
    private readonly bytes;
    constructor(type: number, de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getOffset(): number;
    getLength(): number;
    getBytes(): Uint8Array;
}
