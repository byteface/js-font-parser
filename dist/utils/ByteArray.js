var ByteArray = /** @class */ (function () {
    function ByteArray(byteArray) {
        this.offset = 0;
        this.dataView = new DataView(byteArray.buffer);
        this.offset = 0;
    }
    ByteArray.prototype.readByte = function () {
        // console.log( this.dataView.buffer )
        // console.log(this.offset);
        return this.dataView.getUint8(this.offset++); // NOTE - reads unsigned
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
    ByteArray.prototype.readUnsignedByte = function () {
        // Read a byte and convert it to an unsigned value
        return this.readByte() & 0xFF; // Ensure the byte is treated as unsigned
    };
    ByteArray.prototype.seek = function (position) {
        // Ensure the position is within bounds
        if (position < 0 || position >= this.dataView.byteLength) {
            throw new RangeError("Position out of bounds");
        }
        this.offset = position;
    };
    return ByteArray;
}());
export { ByteArray };
