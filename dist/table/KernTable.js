import { Table } from "./Table.js";
var KernTable = /** @class */ (function () {
    /** Creates new KernTable */
    function KernTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.nTables = byte_ar.readUnsignedShort();
        this.tables = new Array(this.nTables);
        for (var i = 0; i < this.nTables; i++) {
            this.tables[i] = KernSubtable.read(byte_ar);
        }
    }
    KernTable.prototype.getSubtableCount = function () {
        return this.nTables;
    };
    KernTable.prototype.getSubtable = function (i) {
        return this.tables[i];
    };
    KernTable.prototype.getType = function () {
        return Table.kern;
    };
    return KernTable;
}());
export { KernTable };
