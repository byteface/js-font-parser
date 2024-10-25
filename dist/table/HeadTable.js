import { Table } from "./Table.js";
var HeadTable = /** @class */ (function () {
    function HeadTable(de, byte_ar) {
        // console.log('HEAD TABLE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        byte_ar.offset = de.offset;
        this.versionNumber = byte_ar.readInt();
        this.fontRevision = byte_ar.readInt();
        this.checkSumAdjustment = byte_ar.readInt();
        this.magicNumber = byte_ar.readInt();
        this.flags = byte_ar.readShort();
        this.unitsPerEm = byte_ar.readShort();
        this.created = this.readLong(byte_ar);
        this.modified = this.readLong(byte_ar);
        this.xMin = byte_ar.readShort();
        this.yMin = byte_ar.readShort();
        this.xMax = byte_ar.readShort();
        this.yMax = byte_ar.readShort();
        this.macStyle = byte_ar.readShort();
        this.lowestRecPPEM = byte_ar.readShort();
        this.fontDirectionHint = byte_ar.readShort();
        this.indexToLocFormat = byte_ar.readShort();
        this.glyphDataFormat = byte_ar.readShort();
        // console.log( "HEAD_TABLE", this.toString() );
    }
    /**
     * TODO - put this on my bytearray class!!
     * Reads a long value from the byte array.
     * @param b The byte array.
     * @return The long value.
     */
    HeadTable.prototype.readLong = function (b) {
        var high = (b.readUnsignedByte() << 24) |
            (b.readUnsignedByte() << 16) |
            (b.readUnsignedByte() << 8) |
            b.readUnsignedByte();
        var low = (b.readUnsignedByte() << 24) |
            (b.readUnsignedByte() << 16) |
            (b.readUnsignedByte() << 8) |
            b.readUnsignedByte();
        // Combine the two 32-bit values into a 64-bit number
        // Shift `high` by 32 bits and add the `low` part
        var num = (high * Math.pow(2, 32)) + (low >>> 0); // Use `>>> 0` to ensure low is treated as unsigned
        return num;
    };
    HeadTable.prototype.getType = function () {
        return Table.head;
    };
    HeadTable.prototype.toString = function () {
        return "head\n\tversionNumber: ".concat(this.versionNumber, "\n\tfontRevision: ").concat(this.fontRevision, "\n\tcheckSumAdjustment: ").concat(this.checkSumAdjustment, "\n\tmagicNumber: ").concat(this.magicNumber, "\n\tflags: ").concat(this.flags, "\n\tunitsPerEm: ").concat(this.unitsPerEm, "\n\tcreated: ").concat(this.created, "\n\tmodified: ").concat(this.modified, "\n\txMin: ").concat(this.xMin, ", yMin: ").concat(this.yMin, "\n\txMax: ").concat(this.xMax, ", yMax: ").concat(this.yMax, "\n\tmacStyle: ").concat(this.macStyle, "\n\tlowestRecPPEM: ").concat(this.lowestRecPPEM, "\n\tfontDirectionHint: ").concat(this.fontDirectionHint, "\n\tindexToLocFormat: ").concat(this.indexToLocFormat, "\n\tglyphDataFormat: ").concat(this.glyphDataFormat);
    };
    return HeadTable;
}());
export { HeadTable };
