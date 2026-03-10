// UNTESTED
export class LangSysRecord {
    tag;
    offset;
    constructor(byte_ar) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
    getTag() {
        return this.tag;
    }
    getOffset() {
        return this.offset;
    }
}
