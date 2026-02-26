import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { CmapFormat } from "./CmapFormat.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
var CmapTable = /** @class */ (function () {
    function CmapTable(de, byteArray) {
        byteArray.offset = de.offset;
        var fp = byteArray.offset;
        this.version = byteArray.readUnsignedShort();
        this.numTables = byteArray.readUnsignedShort();
        // Get each of the index entries
        this.entries = [];
        for (var i = 0; i < this.numTables; i++) {
            this.entries.push(new CmapIndexEntry(byteArray));
        }
        // Get each of the tables
        this.formats = [];
        for (var j = 0; j < this.numTables; j++) {
            Debug.log('Theres a table', j);
            byteArray.offset = fp + this.entries[j].offset;
            var format = byteArray.readUnsignedShort();
            // const cmf = new CmapFormat(byteArray);
            var value = CmapFormat.create(format, byteArray);
            this.formats.push(value);
        }
        Debug.log(this.toString());
    }
    CmapTable.prototype.getCmapFormat = function (platformId, encodingId) {
        // Find the requested format
        for (var i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.formats[i];
            }
        }
        return null;
    };
    CmapTable.prototype.getCmapFormats = function (platformId, encodingId) {
        var matches = [];
        for (var i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                matches.push(this.formats[i]);
            }
        }
        return matches;
    };
    CmapTable.prototype.getType = function () {
        return Table.cmap;
    };
    CmapTable.prototype.toString = function () {
        var sb = ["cmap\n"];
        // Get each of the index entries
        for (var i = 0; i < this.numTables; i++) {
            sb.push("\t".concat(this.entries[i].toString(), "\n"));
        }
        // Get each of the tables
        for (var i = 0; i < this.numTables; i++) {
            sb.push("\t".concat(this.formats[i].toString(), "\n"));
        }
        return sb.join('');
    };
    return CmapTable;
}());
export { CmapTable };
