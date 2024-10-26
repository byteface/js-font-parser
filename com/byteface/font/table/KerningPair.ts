// UNTESTED

import { ByteArray } from "../utils/ByteArray";

export class KerningPair {
    private left: number;
    private right: number;
    private value: number;

    constructor(byte_ar: ByteArray) {
        this.left = byte_ar.readUnsignedShort();
        this.right = byte_ar.readUnsignedShort();
        this.value = byte_ar.readShort();
    }

    getLeft(): number {
        return this.left;
    }

    getRight(): number {
        return this.right;
    }

    getValue(): number {
        return this.value;
    }
}
