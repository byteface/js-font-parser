// UNTESTED
export class KerningPair {
    left;
    right;
    value;
    constructor(byte_ar) {
        this.left = byte_ar.readUnsignedShort();
        this.right = byte_ar.readUnsignedShort();
        this.value = byte_ar.readShort();
    }
    getLeft() {
        return this.left;
    }
    getRight() {
        return this.right;
    }
    getValue() {
        return this.value;
    }
}
