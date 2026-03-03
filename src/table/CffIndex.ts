import { ByteArray } from '../utils/ByteArray.js';

export class CffIndex {
    count: number;
    objects: Uint8Array[];

    constructor(count: number, objects: Uint8Array[]) {
        this.count = count;
        this.objects = objects;
    }

    static read(byte_ar: ByteArray, offset?: number): CffIndex {
        const prev = byte_ar.offset;
        if (offset != null) {
            byte_ar.offset = offset;
        }

        const count = byte_ar.readUnsignedShort();
        if (count === 0) {
            return new CffIndex(0, []);
        }

        const offSize = byte_ar.readUnsignedByte();
        const offsets: number[] = new Array(count + 1);
        for (let i = 0; i < offsets.length; i++) {
            let value = 0;
            for (let j = 0; j < offSize; j++) {
                value = (value << 8) | byte_ar.readUnsignedByte();
            }
            offsets[i] = value;
        }

        const dataStart = byte_ar.offset;
        const objects: Uint8Array[] = [];
        const data = new Uint8Array(byte_ar.dataView.buffer);
        for (let i = 0; i < count; i++) {
            const start = dataStart + offsets[i] - 1;
            const end = dataStart + offsets[i + 1] - 1;
            objects.push(data.slice(start, end));
        }

        byte_ar.offset = dataStart + offsets[count] - 1;
        if (offset != null) {
            const end = byte_ar.offset;
            byte_ar.offset = end;
            if (prev != null) {
                // keep current offset for caller
            }
        }
        return new CffIndex(count, objects);
    }
}
