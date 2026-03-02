var Anchor = /** @class */ (function () {
    function Anchor(format, x, y, anchorPoint) {
        this.format = format;
        this.x = x;
        this.y = y;
        this.anchorPoint = anchorPoint;
    }
    Anchor.read = function (byte_ar, offset) {
        if (!offset)
            return null;
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        var x = byte_ar.readShort();
        var y = byte_ar.readShort();
        if (format === 2) {
            var anchorPoint = byte_ar.readUnsignedShort();
            byte_ar.offset = prev;
            return new Anchor(format, x, y, anchorPoint);
        }
        if (format === 3) {
            // ignore device tables for now
            byte_ar.readUnsignedShort();
            byte_ar.readUnsignedShort();
        }
        byte_ar.offset = prev;
        return new Anchor(format, x, y);
    };
    return Anchor;
}());
export { Anchor };
