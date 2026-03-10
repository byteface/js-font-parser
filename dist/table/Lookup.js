// UNTESTED
export class Lookup {
    // LookupFlag bit enumeration
    static IGNORE_BASE_GLYPHS = 0x0002;
    static IGNORE_BASE_LIGATURES = 0x0004;
    static IGNORE_BASE_MARKS = 0x0008;
    static MARK_ATTACHMENT_TYPE = 0xFF00;
    type;
    flag;
    subTableCount;
    subTableOffsets;
    subTables;
    loadedSubtables;
    factory;
    byteArray;
    offset;
    markFilteringSet = null;
    constructor(factory, byte_ar, offset) {
        this.factory = factory;
        this.byteArray = byte_ar;
        this.offset = offset;
        byte_ar.offset = offset;
        this.type = byte_ar.readUnsignedShort();
        this.flag = byte_ar.readUnsignedShort();
        this.subTableCount = byte_ar.readUnsignedShort();
        this.subTableOffsets = new Array(this.subTableCount);
        this.subTables = new Array(this.subTableCount);
        this.loadedSubtables = new Array(this.subTableCount).fill(false);
        for (let i = 0; i < this.subTableCount; i++) {
            this.subTableOffsets[i] = byte_ar.readUnsignedShort();
        }
        if (this.flag & 0x0010) {
            this.markFilteringSet = byte_ar.readUnsignedShort();
        }
    }
    getType() {
        return this.type;
    }
    getFlag() {
        return this.flag;
    }
    getSubtableCount() {
        return this.subTableCount;
    }
    getSubtable(i) {
        if (!this.loadedSubtables[i]) {
            this.subTables[i] = this.factory.read(this.type, this.byteArray, this.offset + this.subTableOffsets[i]);
            this.loadedSubtables[i] = true;
        }
        return this.subTables[i];
    }
    getMarkFilteringSet() {
        return this.markFilteringSet;
    }
}
