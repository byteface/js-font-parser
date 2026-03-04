import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
var HmtxTable = /** @class */ (function () {
    function HmtxTable(de, byte_ar) {
        // console.log('HmtxTable --');
        byte_ar.offset = de.offset;
        this.advanceWidths = null;
        this.leftSideBearing = null;
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
        this.advanceWidths = [];
        this.leftSideBearing = [];
        for (var i = 0; i < numberOfHMetrics; i++) {
            var advance = this.buf.readUnsignedShort();
            var lsb = this.buf.readShort();
            this.advanceWidths.push(advance);
            this.leftSideBearing.push(lsb);
        }
        if (lsbCount > 0) {
            for (var j = 0; j < lsbCount; j++) {
                this.leftSideBearing.push(this.buf.readShort());
            }
        }
        this.buf = null;
    };
    HmtxTable.prototype.getAdvanceWidth = function (i) {
        if (this.advanceWidths === null) {
            return 0;
        }
        if (i < this.advanceWidths.length) {
            return this.advanceWidths[i];
        }
        else {
            return this.advanceWidths[this.advanceWidths.length - 1];
        }
    };
    HmtxTable.prototype.getLeftSideBearing = function (i) {
        if (this.leftSideBearing === null) {
            return 0;
        }
        return this.leftSideBearing[i] != null ? this.leftSideBearing[i] : 0;
    };
    HmtxTable.prototype.getType = function () {
        return Table.hmtx;
    };
    return HmtxTable;
}());
export { HmtxTable };
