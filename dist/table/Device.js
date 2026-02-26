var Device = /** @class */ (function () {
    function Device(byte_ar) {
        this.startSize = byte_ar.readUnsignedShort();
        this.endSize = byte_ar.readUnsignedShort();
        this.deltaFormat = byte_ar.readUnsignedShort();
        var size = this.startSize - this.endSize;
        switch (this.deltaFormat) {
            case 1:
                size = (size % 8 === 0) ? size / 8 : Math.floor(size / 8) + 1;
                break;
            case 2:
                size = (size % 4 === 0) ? size / 4 : Math.floor(size / 4) + 1;
                break;
            case 3:
                size = (size % 2 === 0) ? size / 2 : Math.floor(size / 2) + 1;
                break;
        }
        this.deltaValues = new Array(size);
        for (var i = 0; i < size; i++) {
            this.deltaValues[i] = byte_ar.readUnsignedShort();
        }
    }
    return Device;
}());
export { Device };
