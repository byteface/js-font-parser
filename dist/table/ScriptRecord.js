export class ScriptRecord {
    tag;
    offset;
    constructor(byte_ar) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
}
