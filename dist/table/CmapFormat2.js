var CmapFormat2 = /** @class */ (function () {
    function CmapFormat2(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 2;
        // Initialize arrays
        this.subHeaderKeys = [];
        this.subHeaders1 = null; // Set based on your specific implementation
        this.subHeaders2 = null; // Set based on your specific implementation
        this.glyphIndexArray = null; // Set based on your specific implementation
    }
    CmapFormat2.prototype.getFirst = function () {
        return 0; // Modify as necessary
    };
    CmapFormat2.prototype.getLast = function () {
        return 0; // Modify as necessary
    };
    CmapFormat2.prototype.mapCharCode = function (charCode) {
        return 0; // Modify as necessary
    };
    CmapFormat2.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version);
    };
    return CmapFormat2;
}());
export { CmapFormat2 };
