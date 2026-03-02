import { ByteArray } from '../utils/ByteArray.js';

export class Anchor {
    format: number;
    x: number;
    y: number;
    anchorPoint?: number;

    constructor(format: number, x: number, y: number, anchorPoint?: number) {
        this.format = format;
        this.x = x;
        this.y = y;
        this.anchorPoint = anchorPoint;
    }

    static read(byte_ar: ByteArray, offset: number): Anchor | null {
        if (!offset) return null;
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
