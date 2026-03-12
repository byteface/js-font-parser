export class BaseTable {
    readTag(byte_ar) {
        return String.fromCharCode(byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte());
    }
    readLongDateTime(byte_ar) {
        const high = byte_ar.readUnsignedInt();
        const low = byte_ar.readUnsignedInt();
        return (high * 2 ** 32) + low;
    }
}
