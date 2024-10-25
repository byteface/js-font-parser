import { DirectoryEntry } from "./DirectoryEntry.js";
var TableDirectory = /** @class */ (function () {
    function TableDirectory(byte_ar) {
        this.version = byte_ar.readInt();
        this.numTables = byte_ar.readUnsignedShort();
        this.searchRange = byte_ar.readUnsignedShort();
        this.entrySelector = byte_ar.readUnsignedShort();
        this.rangeShift = byte_ar.readUnsignedShort();
        this.entries = [];
        // console.log('tabledir::', this.version, this.numTables, this.searchRange, this.entrySelector, this.rangeShift);
        for (var i = 0; i < this.numTables; i++) {
            this.entries.push(new DirectoryEntry(byte_ar));
        }
        // Bubble sort the entries based on their offset
        var modified = true;
        while (modified) {
            modified = false;
            for (var j = 0; j < this.numTables - 1; j++) {
                var entryA = this.entries[j];
                var entryB = this.entries[j + 1];
                if ((entryA === null || entryA === void 0 ? void 0 : entryA.offset) != null && // Check if entryA and its offset exist
                    (entryB === null || entryB === void 0 ? void 0 : entryB.offset) != null && // Check if entryB and its offset exist
                    entryA.offset > entryB.offset) {
                    var temp = entryA;
                    this.entries[j] = entryB;
                    this.entries[j + 1] = temp;
                    modified = true;
                }
            }
        }
    }
    // Returns an entry by index
    TableDirectory.prototype.getEntry = function (index) {
        return this.entries[index];
    };
    // Returns an entry by tag
    TableDirectory.prototype.getEntryByTag = function (tag) {
        var _a;
        for (var i = 0; i < this.numTables; i++) {
            var entryTag = (_a = this.entries[i]) === null || _a === void 0 ? void 0 : _a.tag;
            // Ensure both are strings and compare
            if (entryTag != null && String(entryTag) === tag) {
                return this.entries[i];
            }
        }
        return null;
    };
    return TableDirectory;
}());
export { TableDirectory };
