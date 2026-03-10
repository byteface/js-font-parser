import { ByteArray } from "../utils/ByteArray.js";
import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { CmapFormat } from "./CmapFormat.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
var CmapTable = /** @class */ (function () {
    function CmapTable(de, byteArray) {
        this.baseOffset = de.offset;
        this.data = new Uint8Array(byteArray.dataView.buffer, byteArray.dataView.byteOffset, byteArray.dataView.byteLength);
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
        this._formats = new Array(this.numTables).fill(null);
        this.formatKinds = new Array(this.numTables).fill(-1);
        this.loadedFormats = new Array(this.numTables).fill(false);
        for (var j = 0; j < this.numTables; j++) {
            byteArray.offset = fp + this.entries[j].offset;
            this.formatKinds[j] = byteArray.readUnsignedShort();
        }
        if (Debug.enabled) {
            Debug.log(this.toString());
        }
    }
    Object.defineProperty(CmapTable.prototype, "formats", {
        get: function () {
            for (var i = 0; i < this.numTables; i++) {
                this.ensureFormatLoaded(i);
            }
            return this._formats;
        },
        enumerable: false,
        configurable: true
    });
    CmapTable.prototype.getCmapFormat = function (platformId, encodingId) {
        // Find the requested format
        for (var i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                return this.ensureFormatLoaded(i);
            }
        }
        return null;
    };
    CmapTable.prototype.getCmapFormats = function (platformId, encodingId) {
        var matches = [];
        for (var i = 0; i < this.numTables; i++) {
            if (this.entries[i].platformId === platformId && this.entries[i].encodingId === encodingId) {
                var fmt = this.ensureFormatLoaded(i);
                if (fmt)
                    matches.push(fmt);
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
            var fmt = this.ensureFormatLoaded(i);
            sb.push("\t".concat(fmt ? fmt.toString() : "unknown cmap format", "\n"));
        }
        return sb.join('');
    };
    CmapTable.prototype.ensureFormatLoaded = function (index) {
        var _a;
        if (this.loadedFormats[index]) {
            return (_a = this._formats[index]) !== null && _a !== void 0 ? _a : null;
        }
        return this.loadFormat(index);
    };
    CmapTable.prototype.loadFormat = function (index) {
        this.loadedFormats[index] = true;
        var entry = this.entries[index];
        var byteArray = new ByteArray(this.data);
        byteArray.offset = this.baseOffset + entry.offset;
        byteArray.readUnsignedShort();
        var value = CmapFormat.create(this.formatKinds[index], byteArray);
        this._formats[index] = value;
        return value;
    };
    return CmapTable;
}());
export { CmapTable };
