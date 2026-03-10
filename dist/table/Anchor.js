export class Anchor {
    format;
    x;
    y;
    anchorPoint;
    constructor(format, x, y, anchorPoint) {
        this.format = format;
        this.x = x;
        this.y = y;
        this.anchorPoint = anchorPoint;
    }
    static read(byte_ar, offset) {
        if (!offset)
            return null;
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        const x = byte_ar.readShort();
        const y = byte_ar.readShort();
        if (format === 2) {
            const anchorPoint = byte_ar.readUnsignedShort();
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
    }
}
