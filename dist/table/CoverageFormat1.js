// UNTESTED
var CoverageFormat1 = /** @class */ (function () {
    function CoverageFormat1(byte_ar) {
        this.glyphCount = byte_ar.readUnsignedShort();
        this.glyphIds = new Array(this.glyphCount);
        for (var i = 0; i < this.glyphCount; i++) {
            this.glyphIds[i] = byte_ar.readUnsignedShort();
        }
    }
    CoverageFormat1.prototype.getFormat = function () {
        return 1;
    };
    CoverageFormat1.prototype.findGlyph = function (glyphId) {
        for (var i = 0; i < this.glyphCount; i++) {
            if (this.glyphIds[i] === glyphId) {
                return i;
            }
        }
        return -1;
    };
    return CoverageFormat1;
}());
export { CoverageFormat1 };
