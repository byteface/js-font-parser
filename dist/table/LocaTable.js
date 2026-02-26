import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
var LocaTable = /** @class */ (function () {
    function LocaTable(de, byte_ar) {
        this.offsets = [];
        this.factor = 0;
        byte_ar.offset = de.offset;
        // console.log('locaTable', byte_ar.offset, de.length)
        // console.log(`Buffer length: ${byte_ar.dataView.byteLength}`);
        var extractedData = new Uint8Array(byte_ar.dataView.buffer.slice(byte_ar.offset, byte_ar.offset + de.length));
        this.buf = new ByteArray(extractedData);
        // console.log('Buffer Bytes:', this.buf.dataView.byteLength);
        // console.log('New Buffer First Bytes:', Array.from(new Uint8Array(byte_ar.dataView.buffer, byte_ar.offset, 16)));
    }
    LocaTable.prototype.run = function (numGlyphs, shortEntries) {
        if (this.buf === null) {
            return;
        }
        this.offsets = [];
        // const byteArray = new Uint8Array(this.buf.dataView.buffer);
        // console.log('Buffer Bytes:', byteArray);
        if (shortEntries) {
            this.factor = 2;
            for (var i = 0; i <= numGlyphs; i++) {
                // Read 2 bytes for short entries
                var offset = (this.buf.readUnsignedByte() << 8) | this.buf.readUnsignedByte();
                this.offsets.push(offset);
            }
        }
        else {
            this.factor = 1;
            for (var j = 0; j <= numGlyphs; j++) {
                var byte1 = this.buf.readUnsignedByte();
                var byte2 = this.buf.readUnsignedByte();
                var byte3 = this.buf.readUnsignedByte();
                var byte4 = this.buf.readUnsignedByte();
                this.offsets[j] = (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4;
                // console.log(`Glyph ${j}: [${byte1.toString(16)}, ${byte2.toString(16)}, ${byte3.toString(16)}, ${byte4.toString(16)}] -> Offset: ${this.offsets[j]}`);
            }
        }
        this.buf = null; // Clear the buffer after use (optional)
    };
    // logUint8Array(uint8Array) {
    //     const bytes = Array.from(uint8Array); // Convert to regular array for easier logging
    //     // console.log("Uint8Array Buffer Bytes:", bytes);
    // }
    LocaTable.prototype.getOffset = function (i) {
        if (this.offsets === null) {
            return 0;
        }
        return this.offsets[i] * this.factor;
    };
    LocaTable.prototype.getType = function () {
        return Table.loca;
    };
    return LocaTable;
}());
export { LocaTable };
