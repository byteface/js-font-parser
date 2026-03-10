var ByteArray = /** @class */ (function () {
    function ByteArray(byteArray) {
        this.offset = 0;
        this.dataView = new DataView(byteArray.buffer, byteArray.byteOffset, byteArray.byteLength);
        this.offset = 0;
    }
    ByteArray.prototype.readByte = function () {
        return this.dataView.getUint8(this.offset++);
    };
    ByteArray.prototype.readBool = function () {
        return this.readByte() !== 0;
    };
    ByteArray.prototype.readInt = function (offset, littleEndian) {
        if (offset === void 0) { offset = this.offset; }
        if (littleEndian === void 0) { littleEndian = false; }
        var value = this.dataView.getInt32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    };
    ByteArray.prototype.readUInt = function (offset, littleEndian) {
        if (offset === void 0) { offset = this.offset; }
        if (littleEndian === void 0) { littleEndian = false; }
        var value = this.dataView.getUint32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    };
    ByteArray.prototype.readFloat = function (offset, littleEndian) {
        if (offset === void 0) { offset = this.offset; }
        if (littleEndian === void 0) { littleEndian = false; }
        var value = this.dataView.getFloat32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    };
    ByteArray.prototype.readUnsignedShort = function (offset, littleEndian) {
        if (offset === void 0) { offset = this.offset; }
        if (littleEndian === void 0) { littleEndian = false; }
        var value = this.dataView.getUint16(offset, littleEndian);
        this.offset += 2; // Move the offset forward by 2 bytes for the next read
        return value;
    };
    ByteArray.prototype.readShort = function (offset, littleEndian) {
        if (littleEndian === void 0) { littleEndian = false; }
        if (offset === undefined) {
            offset = this.offset;
        }
        var value = this.dataView.getInt16(offset, littleEndian);
        this.offset += 2; // Move the offset forward by 2 bytes for the next read
        return value;
    };
    ByteArray.prototype.readUnsignedInt = function (offset, littleEndian) {
        if (littleEndian === void 0) { littleEndian = false; }
        if (offset === undefined) {
            offset = this.offset;
        }
        var value = this.dataView.getUint32(offset, littleEndian);
        this.offset += 4; // Move the offset forward by 4 bytes for the next read
        return value;
    };
    ByteArray.prototype.readFixed = function (offset) {
        if (offset === undefined) {
            offset = this.offset;
        }
        var value = this.dataView.getInt32(offset, false);
        this.offset += 4;
        return value / 65536;
    };
    ByteArray.prototype.readUnsignedByte = function () {
        return this.readByte() & 0xFF;
    };
    ByteArray.prototype.seek = function (position) {
        if (position < 0 || position >= this.dataView.byteLength) {
            throw new RangeError("Position out of bounds");
        }
        this.offset = position;
    };
    ByteArray.prototype.readBytes = function (length) {
        if (length <= 0)
            return new Uint8Array(0);
        var start = this.offset;
        var end = start + length;
        if (end > this.dataView.byteLength) {
            throw new RangeError("Read exceeds buffer length");
        }
        this.offset = end;
        return new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + start, length);
    };
    return ByteArray;
}());
export { ByteArray };
