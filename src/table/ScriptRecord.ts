import { ByteArray } from "../utils/ByteArray.js";

export class ScriptRecord {
    public tag: number;
    public offset: number;

    constructor(byte_ar: ByteArray) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
}