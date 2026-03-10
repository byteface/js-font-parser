import { ByteArray } from "../utils/ByteArray.js";
import { ILookupSubtableFactory } from "./ILookupSubtableFactory.js";
import { LookupSubtable } from "./LookupSubtable.js";
export declare class Lookup {
    static readonly IGNORE_BASE_GLYPHS: number;
    static readonly IGNORE_BASE_LIGATURES: number;
    static readonly IGNORE_BASE_MARKS: number;
    static readonly MARK_ATTACHMENT_TYPE: number;
    private type;
    private flag;
    private subTableCount;
    private subTableOffsets;
    private subTables;
    private loadedSubtables;
    private factory;
    private byteArray;
    private offset;
    private markFilteringSet;
    constructor(factory: ILookupSubtableFactory, byte_ar: ByteArray, offset: number);
    getType(): number;
    getFlag(): number;
    getSubtableCount(): number;
    getSubtable(i: number): LookupSubtable | null;
    getMarkFilteringSet(): number | null;
}
