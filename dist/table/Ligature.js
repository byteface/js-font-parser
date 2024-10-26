var Ligature = /** @class */ (function () {
    function Ligature(byteAr) {
        this.ligGlyph = byteAr.readUnsignedShort();
        this.compCount = byteAr.readUnsignedShort();
        this.components = new Array(this.compCount - 1);
        for (var i = 0; i < this.compCount - 1; i++) {
            this.components[i] = byteAr.readUnsignedShort();
        }
    }
    Ligature.prototype.getGlyphCount = function () {
        return this.compCount;
    };
    Ligature.prototype.getGlyphId = function (i) {
        return (i === 0) ? this.ligGlyph : this.components[i - 1];
    };
    return Ligature;
}());
export { Ligature };
