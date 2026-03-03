export class ByteArray {
    public dataView: DataView;
    public offset: number = 0;

    constructor(byteArray: Uint8Array) {
        // this.dataView = new DataView(byteArray.buffer);
        this.dataView = new DataView(
            byteArray.buffer,
            byteArray.byteOffset,
            byteArray.byteLength
        );
        this.offset = 0;
    }

    readByte(): number {
        // console.log( this.dataView.buffer )
        // console.log(this.offset);
        return this.dataView.getUint8(this.offset++);     // NOTE - reads unsigned
    }

    readBool(): boolean {
        return this.readByte() !== 0;
    }

    readInt(offset: number = this.offset, littleEndian: boolean = false): number {
        const value = this.dataView.getInt32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    }

    readUInt(offset: number = this.offset, littleEndian: boolean = false): number {
        const value = this.dataView.getUint32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    }

    readFloat(offset: number = this.offset, littleEndian: boolean = false): number {
        const value = this.dataView.getFloat32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    }

    readUnsignedShort(offset: number = this.offset, littleEndian: boolean = false): number {
        const value = this.dataView.getUint16(offset, littleEndian);
        this.offset += 2; // Move the offset forward by 2 bytes for the next read
        return value;
    }

    readShort(offset?: number, littleEndian: boolean = false): number {
        if (offset === undefined) { offset = this.offset; }
        const value = this.dataView.getInt16(offset, littleEndian);
        this.offset += 2; // Move the offset forward by 2 bytes for the next read
        return value;
    }

    readUnsignedInt(offset?: number, littleEndian: boolean = false): number {
        if (offset === undefined) { offset = this.offset; }
        const value = this.dataView.getUint32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    }

    readFixed(offset?: number): number {
        if (offset === undefined) { offset = this.offset; }
        const value = this.dataView.getInt32(offset, false);
        this.offset += 4;
        return value / 65536;
    }

    public readUnsignedByte(): number {
        // Read a byte and convert it to an unsigned value
        return this.readByte() & 0xFF; // Ensure the byte is treated as unsigned
    }

    seek(position: number): void {
        // Ensure the position is within bounds
        if (position < 0 || position >= this.dataView.byteLength) {
            throw new RangeError("Position out of bounds");
        }
        this.offset = position;
    }

    readBytes(length: number): Uint8Array {
        if (length <= 0) return new Uint8Array(0);
        const start = this.offset;
        const end = start + length;
        if (end > this.dataView.byteLength) {
            throw new RangeError("Read exceeds buffer length");
        }
        this.offset = end;
        // return new Uint8Array(this.dataView.buffer.slice(start, end));
        return new Uint8Array(
            this.dataView.buffer,
            this.dataView.byteOffset + start,
            length
        );
    }


}
