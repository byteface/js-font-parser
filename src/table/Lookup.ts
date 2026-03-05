// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";
import { ILookupSubtableFactory } from "./ILookupSubtableFactory.js";
import { LookupSubtable } from "./LookupSubtable.js";

export class Lookup {
    // LookupFlag bit enumeration
    public static readonly IGNORE_BASE_GLYPHS: number = 0x0002;
    public static readonly IGNORE_BASE_LIGATURES: number = 0x0004;
    public static readonly IGNORE_BASE_MARKS: number = 0x0008;
    public static readonly MARK_ATTACHMENT_TYPE: number = 0xFF00;

    private type: number;
    private flag: number;
    private subTableCount: number;
    private subTableOffsets: number[];
    private subTables: Array<LookupSubtable | null>;
    private markFilteringSet: number | null = null;

    constructor(factory: ILookupSubtableFactory, byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;
        this.type = byte_ar.readUnsignedShort();
        this.flag = byte_ar.readUnsignedShort();
        this.subTableCount = byte_ar.readUnsignedShort();
        this.subTableOffsets = new Array(this.subTableCount);
        this.subTables = new Array<LookupSubtable | null>(this.subTableCount);

        for (let i = 0; i < this.subTableCount; i++) {
            this.subTableOffsets[i] = byte_ar.readUnsignedShort();
        }

        if (this.flag & 0x0010) {
            this.markFilteringSet = byte_ar.readUnsignedShort();
        }
        
        for (let j = 0; j < this.subTableCount; j++) {
            this.subTables[j] = factory.read(this.type, byte_ar, offset + this.subTableOffsets[j]);
        }
    }

    public getType(): number {
        return this.type;
    }

    public getFlag(): number {
        return this.flag;
    }

    public getSubtableCount(): number {
        return this.subTableCount;
    }

    public getSubtable(i: number): LookupSubtable | null {
        return this.subTables[i];
    }

    public getMarkFilteringSet(): number | null {
        return this.markFilteringSet;
    }
}
