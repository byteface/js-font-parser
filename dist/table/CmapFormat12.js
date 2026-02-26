var CmapFormat12 = /** @class */ (function () {
    function CmapFormat12(byteArray) {
        byteArray.readUnsignedShort(); // reserved
        this.length = byteArray.readUnsignedInt(); // Read length (uint32)
        this.language = byteArray.readUnsignedInt(); // Read language (uint32)
        this.format = 12; // Set format number
        this.numGroups = byteArray.readUnsignedInt(); // Read number of groups
        this.groups = []; // Initialize groups array
        // Read each group
        for (var i = 0; i < this.numGroups; i++) {
            var start = byteArray.readUnsignedInt();
            var end = byteArray.readUnsignedInt();
            var glyphId = byteArray.readUnsignedInt();
            this.groups.push({ start: start, end: end, glyphId: glyphId });
        }
    }
    CmapFormat12.prototype.getFormatType = function () {
        return this.format;
    };
    CmapFormat12.prototype.getGlyphIndex = function (charCode) {
        // Iterate through the groups to find the corresponding glyph ID
        for (var _i = 0, _a = this.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            if (charCode >= group.start && charCode <= group.end) {
                return group.glyphId + (charCode - group.start); // Calculate glyph ID
            }
        }
        return 0; // Return 0 if not found
    };
    CmapFormat12.prototype.getFirst = function () {
        return this.groups.length > 0 ? this.groups[0].start : 0;
    };
    CmapFormat12.prototype.getLast = function () {
        return this.groups.length > 0 ? this.groups[this.groups.length - 1].end : 0;
    };
    CmapFormat12.prototype.mapCharCode = function (charCode) {
        return this.getGlyphIndex(charCode);
    };
    CmapFormat12.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", language: ").concat(this.language, ", numGroups: ").concat(this.numGroups);
    };
    return CmapFormat12;
}());
export { CmapFormat12 };
