var CmapFormat6 = /** @class */ (function () {
    function CmapFormat6(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 6;
        this.firstCode = 0; // Initialize as needed
        this.entryCount = 0; // Initialize as needed
        this.glyphIdArray = []; // Initialize to an empty array
    }
    CmapFormat6.prototype.getFirst = function () {
        return 0; // Return appropriate value if needed
    };
    CmapFormat6.prototype.getLast = function () {
        return 0; // Return appropriate value if needed
    };
    CmapFormat6.prototype.mapCharCode = function (charCode) {
        return 0; // Return appropriate value if needed
    };
    CmapFormat6.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version);
    };
    return CmapFormat6;
}());
export { CmapFormat6 };
