export class RawTable {
    type;
    offset;
    length;
    bytes;
    constructor(type, de, byte_ar) {
        this.type = type;
        this.offset = de.offset;
        this.length = de.length;
        const prev = byte_ar.offset;
        byte_ar.offset = de.offset;
        this.bytes = byte_ar.readBytes(de.length).slice();
        byte_ar.offset = prev;
    }
    getType() {
        return this.type;
    }
    getOffset() {
        return this.offset;
    }
    getLength() {
        return this.length;
    }
    getBytes() {
        return this.bytes.slice();
    }
}
