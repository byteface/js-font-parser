import { ByteArray } from "../utils/ByteArray.js";

export class LangSysRecord {
    private tag: number;
    private offset: number;

    /** Creates a new LangSysRecord */
    constructor(byte_ar: ByteArray) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }

    public getTag(): number {
        return this.tag;
    }

    public getOffset(): number {
        return this.offset;
    }
}