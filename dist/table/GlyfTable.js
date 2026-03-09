import { ByteArray } from "../utils/ByteArray.js";
import { GlyfSimpleDescript } from "./GlyfSimpleDescript.js";
import { GlyfCompositeDescript } from "./GlyfCompositeDescript.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
var GlyfTable = /** @class */ (function () {
    function GlyfTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        var start = byte_ar.offset;
        var length = de.length;
        var slicedBuffer = byte_ar.dataView.buffer.slice(start, start + length);
        var uint8Array = new Uint8Array(slicedBuffer);
        this.buf = new ByteArray(uint8Array);
        this.descript = new Array(0);
    }
    GlyfTable.prototype.run = function (numGlyphs, loca) {
        if (!this.buf) {
            return;
        }
        this.descript = [];
        for (var i = 0; i < numGlyphs; i++) {
            var offsetCurrent = loca.getOffset(i);
            var offsetNext = loca.getOffset(i + 1);
            var len = offsetNext - offsetCurrent;
            if (len > 0) {
                var bittie = new ByteArray(new Uint8Array(this.buf.dataView.buffer.slice(offsetCurrent, offsetCurrent + len)));
                var numberOfContours = bittie.readShort();
                if (numberOfContours < 0) {
                    this.descript.push(new GlyfCompositeDescript(this, bittie));
                }
                else {
                    Debug.log('Adds a glyf', numberOfContours);
                    // Handle simple glyph description
                    this.descript.push(new GlyfSimpleDescript(this, numberOfContours, bittie));
                }
            }
            else {
                this.descript.push(null);
            }
        }
        this.buf = null;
        for (var j = 0; j < numGlyphs; j++) {
            var desc = this.descript[j];
            if (!desc)
                continue;
            desc.resolve();
        }
        Debug.log("Glyph descriptions resolved");
    };
    // Return the description for the specified glyph index
    GlyfTable.prototype.getDescription = function (i) {
        return this.descript[i];
    };
    GlyfTable.prototype.getType = function () {
        return Table.glyf;
    };
    return GlyfTable;
}());
export { GlyfTable };
