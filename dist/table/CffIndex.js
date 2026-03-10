export class CffIndex {
    count;
    objects;
    constructor(count, objects) {
        this.count = count;
        this.objects = objects;
    }
    static read(byte_ar, offset) {
        return this.readWithCountSize(byte_ar, offset, 2);
    }
    static readCff2(byte_ar, offset) {
        return this.readWithCountSize(byte_ar, offset, 4);
    }
    static readWithCountSize(byte_ar, offset, countSize) {
        const prev = byte_ar.offset;
        if (offset != null) {
            byte_ar.offset = offset;
        }
        const count = countSize === 2 ? byte_ar.readUnsignedShort() : byte_ar.readUnsignedInt();
        if (count === 0) {
            return new CffIndex(0, []);
        }
        const offSize = byte_ar.readUnsignedByte();
        const offsets = new Array(count + 1);
        for (let i = 0; i < offsets.length; i++) {
            let value = 0;
            for (let j = 0; j < offSize; j++) {
                value = (value << 8) | byte_ar.readUnsignedByte();
            }
            offsets[i] = value;
        }
        const dataStart = byte_ar.offset;
        const objects = [];
        const data = new Uint8Array(byte_ar.dataView.buffer, byte_ar.dataView.byteOffset, byte_ar.dataView.byteLength);
        for (let i = 0; i < count; i++) {
            const start = dataStart + offsets[i] - 1;
            const end = dataStart + offsets[i + 1] - 1;
            objects.push(data.subarray(start, end));
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
