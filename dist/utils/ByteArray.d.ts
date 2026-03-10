export declare class ByteArray {
    dataView: DataView;
    offset: number;
    constructor(byteArray: Uint8Array);
    readByte(): number;
    readBool(): boolean;
    readInt(offset?: number, littleEndian?: boolean): number;
    readUInt(offset?: number, littleEndian?: boolean): number;
    readFloat(offset?: number, littleEndian?: boolean): number;
    readUnsignedShort(offset?: number, littleEndian?: boolean): number;
    readShort(offset?: number, littleEndian?: boolean): number;
    readUnsignedInt(offset?: number, littleEndian?: boolean): number;
    readFixed(offset?: number): number;
    readUnsignedByte(): number;
    seek(position: number): void;
    readBytes(length: number): Uint8Array;
}
