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
    Ligature.prototype.getLigatureGlyph = function () {
        return this.ligGlyph;
    };
    Ligature.prototype.getGlyphId = function (i) {
        return (i === 0) ? this.ligGlyph : this.components[i - 1];
    };
    Ligature.prototype.getComponents = function () {
        return this.components.slice();
    };
    return Ligature;
}());
export { Ligature };
