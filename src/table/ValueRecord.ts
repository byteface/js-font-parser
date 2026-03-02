import { ByteArray } from '../utils/ByteArray.js';

export type ValueRecordData = {
    xPlacement?: number;
    yPlacement?: number;
    xAdvance?: number;
    yAdvance?: number;
};

export class ValueRecord {
    static read(byte_ar: ByteArray, valueFormat: number): ValueRecordData {
        const record: ValueRecordData = {};
        if (valueFormat & 0x0001) record.xPlacement = byte_ar.readShort();
        if (valueFormat & 0x0002) record.yPlacement = byte_ar.readShort();
        if (valueFormat & 0x0004) record.xAdvance = byte_ar.readShort();
        if (valueFormat & 0x0008) record.yAdvance = byte_ar.readShort();
        if (valueFormat & 0x0010) byte_ar.readUnsignedShort();
        if (valueFormat & 0x0020) byte_ar.readUnsignedShort();
        if (valueFormat & 0x0040) byte_ar.readUnsignedShort();
        if (valueFormat & 0x0080) byte_ar.readUnsignedShort();
        return record;
    }
}
