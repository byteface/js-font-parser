import { ByteArray } from "../utils/ByteArray.js";
import { ITable } from "./ITable.js";
import { KernSubtable } from "./KernSubtable.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
export declare class KernTable implements ITable {
    version: number;
    nTables: number;
    tables: Array<KernSubtable | null>;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getSubtableCount(): number;
    getSubtable(i: number): KernSubtable | null;
    getKerningValue(leftGlyph: number, rightGlyph: number): number;
    getType(): number;
}
