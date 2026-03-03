var CffIndex = /** @class */ (function () {
    function CffIndex(count, objects) {
        this.count = count;
        this.objects = objects;
    }
    CffIndex.read = function (byte_ar, offset) {
        var prev = byte_ar.offset;
        if (offset != null) {
            byte_ar.offset = offset;
        }
        var count = byte_ar.readUnsignedShort();
        if (count === 0) {
            return new CffIndex(0, []);
        }
        var offSize = byte_ar.readUnsignedByte();
        var offsets = new Array(count + 1);
        for (var i = 0; i < offsets.length; i++) {
            var value = 0;
            for (var j = 0; j < offSize; j++) {
                value = (value << 8) | byte_ar.readUnsignedByte();
            }
            offsets[i] = value;
        }
        var dataStart = byte_ar.offset;
        var objects = [];
        var data = new Uint8Array(byte_ar.dataView.buffer);
        for (var i = 0; i < count; i++) {
            var start = dataStart + offsets[i] - 1;
            var end = dataStart + offsets[i + 1] - 1;
            objects.push(data.slice(start, end));
        }
        byte_ar.offset = dataStart + offsets[count] - 1;
        if (offset != null) {
            var end = byte_ar.offset;
            byte_ar.offset = end;
            if (prev != null) {
                // keep current offset for caller
            }
        }
        return new CffIndex(count, objects);
    };
    return CffIndex;
}());
export { CffIndex };
