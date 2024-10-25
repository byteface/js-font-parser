import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
var HmtxTable = /** @class */ (function () {
    function HmtxTable(de, byte_ar) {
        // console.log('HmtxTable --');
        byte_ar.offset = de.offset;
        this.hMetrics = null;
        this.leftSideBearing = null;
        // TODO - don't trust this. as it was sliced off before
        // Initialize buf with byte_ar data
        // this.buf = new ByteArray(byte_ar.dataView);
        // this.buf = byte_ar; // Directly assign the ByteArray
        var start = byte_ar.offset;
        var length = de.length;
        // Create a new ArrayBuffer from the DataView
        var slicedBuffer = byte_ar.dataView.buffer.slice(start, start + length);
        var uint8Array = new Uint8Array(slicedBuffer);
        // Initialize the buffer using the sliced Uint8Array
        this.buf = new ByteArray(uint8Array); // No endian parameter
    }
    HmtxTable.prototype.run = function (numberOfHMetrics, lsbCount) {
        if (this.buf === null) {
            return;
        }
        this.hMetrics = [];
        for (var i = 0; i < numberOfHMetrics; i++) {
            // Pack 4 bytes from buf into an int and store in hMetrics[]
            this.hMetrics.push((this.buf.readUnsignedByte() << 24) |
                (this.buf.readUnsignedByte() << 16) |
                (this.buf.readUnsignedByte() << 8) |
                (this.buf.readUnsignedByte()));
        }
        if (lsbCount > 0) {
            this.leftSideBearing = [];
            for (var j = 0; j < lsbCount; j++) {
                this.leftSideBearing.push((this.buf.readUnsignedByte() << 8) |
                    (this.buf.readUnsignedByte()));
            }
        }
        this.buf = null;
    };
    HmtxTable.prototype.getAdvanceWidth = function (i) {
        if (this.hMetrics === null) {
            return 0;
        }
        if (i < this.hMetrics.length) {
            return this.hMetrics[i] >> 16;
        }
        else {
            return this.hMetrics[this.hMetrics.length - 1] >> 16;
        }
    };
    HmtxTable.prototype.getLeftSideBearing = function (i) {
        if (this.hMetrics === null) {
            return 0;
        }
        if (i < this.hMetrics.length) {
            return this.hMetrics[i]; // No need for bitwise AND in TypeScript
        }
        else {
            return this.leftSideBearing ? this.leftSideBearing[i - this.hMetrics.length] : 0;
        }
    };
    HmtxTable.prototype.getType = function () {
        return Table.hmtx;
    };
    return HmtxTable;
}());
export { HmtxTable };
