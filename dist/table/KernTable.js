import { KernSubtableFormat0 } from "./KernSubtableFormat0.js";
import { KernSubtableFormat2 } from "./KernSubtableFormat2.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
var KernTable = /** @class */ (function () {
    function KernTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.nTables = byte_ar.readUnsignedShort();
        this.tables = new Array(this.nTables);
        for (var i = 0; i < this.nTables; i++) {
            var start = byte_ar.offset;
            // subtable header
            byte_ar.readUnsignedShort(); // version
            var length_1 = byte_ar.readUnsignedShort();
            var coverage = byte_ar.readUnsignedShort();
            var format = coverage >> 8;
            var table = null;
            switch (format) {
                case 0:
                    table = new KernSubtableFormat0(byte_ar);
                    break;
                case 2:
                    table = new KernSubtableFormat2(byte_ar);
                    break;
                default:
                    Debug.warn("Unsupported KernSubtable format: ".concat(format));
                    break;
            }
            // Ensure we move to the end of the subtable
            var expectedEnd = start + length_1;
            if (byte_ar.offset < expectedEnd) {
                byte_ar.offset = expectedEnd;
            }
            this.tables[i] = table;
        }
    }
    KernTable.prototype.getSubtableCount = function () {
        return this.nTables;
    };
    KernTable.prototype.getSubtable = function (i) {
        return this.tables[i];
    };
    KernTable.prototype.getKerningValue = function (leftGlyph, rightGlyph) {
        for (var _i = 0, _a = this.tables; _i < _a.length; _i++) {
            var subtable = _a[_i];
            if (subtable && subtable instanceof KernSubtableFormat0) {
                return subtable.getKerningValue(leftGlyph, rightGlyph);
            }
        }
        return 0;
    };
    KernTable.prototype.getType = function () {
        return Table.kern;
    };
    return KernTable;
}());
export { KernTable };
