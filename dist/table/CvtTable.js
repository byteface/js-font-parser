import { Table } from "./Table.js";
var CvtTable = /** @class */ (function () {
    function CvtTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        var len = Math.floor(de.length / 2);
        this.values = new Array(len);
        for (var i = 0; i < len; i++) {
            this.values[i] = byte_ar.readShort();
        }
    }
    CvtTable.prototype.getType = function () {
        return Table.cvt;
    };
    CvtTable.prototype.getValues = function () {
        return this.values;
    };
    return CvtTable;
}());
export { CvtTable };
