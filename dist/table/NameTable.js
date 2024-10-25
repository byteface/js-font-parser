import { Table } from "./Table.js";
import { NameRecord } from "./NameRecord.js";
var NameTable = /** @class */ (function () {
    function NameTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.formatSelector = byte_ar.readShort();
        this.numberOfNameRecords = byte_ar.readShort();
        this.stringStorageOffset = byte_ar.readShort();
        // Load the records, which contain the encoding information and string offsets
        this.records = [];
        for (var i = 0; i < this.numberOfNameRecords; i++) {
            this.records.push(new NameRecord(byte_ar));
        }
        // Now load the strings
        for (var j = 0; j < this.numberOfNameRecords; j++) {
            this.records[j].loadString(byte_ar, de.offset + this.stringStorageOffset);
        }
    }
    NameTable.prototype.getRecord = function (nameId) {
        // Search for the first instance of this name ID
        for (var i = 0; i < this.numberOfNameRecords; i++) {
            if (this.records[i].nameId === nameId) {
                return this.records[i].record;
            }
        }
        return "";
    };
    NameTable.prototype.getType = function () {
        return Table.pName;
    };
    return NameTable;
}());
export { NameTable };
