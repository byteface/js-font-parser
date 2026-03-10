import { ByteArray } from "../utils/ByteArray.js";
import { ITable } from "./ITable.js";
export declare class DirectoryEntry {
    tag: number | null;
    checksum: number | null;
    offset: number;
    length: number;
    table: ITable | null;
    constructor(byteAr: ByteArray);
    toString(): string;
}
