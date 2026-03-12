import { ByteArray } from "../utils/ByteArray.js";

export abstract class BaseTable {
    protected readTag(byte_ar: ByteArray): string {
        return String.fromCharCode(
            byte_ar.readUnsignedByte(),
            byte_ar.readUnsignedByte(),
            byte_ar.readUnsignedByte(),
            byte_ar.readUnsignedByte()
        );
    }

    protected readLongDateTime(byte_ar: ByteArray): number {
        const high = byte_ar.readUnsignedInt();
        const low = byte_ar.readUnsignedInt();
        return (high * 2 ** 32) + low;
    }
}
