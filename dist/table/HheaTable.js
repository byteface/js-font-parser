import { Table } from "./Table.js";
var HheaTable = /** @class */ (function () {
    function HheaTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readInt();
        this.ascender = byte_ar.readShort();
        this.descender = byte_ar.readShort();
        this.lineGap = byte_ar.readShort();
        this.advanceWidthMax = byte_ar.readShort();
        this.minLeftSideBearing = byte_ar.readShort();
        this.minRightSideBearing = byte_ar.readShort();
        this.xMaxExtent = byte_ar.readShort();
        this.caretSlopeRise = byte_ar.readShort();
        this.caretSlopeRun = byte_ar.readShort();
        for (var i = 0; i < 5; i++) {
            byte_ar.readShort(); // Ignored values
        }
        this.metricDataFormat = byte_ar.readShort();
        this.numberOfHMetrics = byte_ar.readUnsignedShort();
    }
    HheaTable.prototype.getType = function () {
        return Table.hhea;
    };
    return HheaTable;
}());
export { HheaTable };
