export class Ligature {
    ligGlyph;
    compCount;
    components;
    constructor(byteAr) {
        this.ligGlyph = byteAr.readUnsignedShort();
        this.compCount = byteAr.readUnsignedShort();
        this.components = new Array(this.compCount - 1);
        for (let i = 0; i < this.compCount - 1; i++) {
            this.components[i] = byteAr.readUnsignedShort();
        }
    }
    getGlyphCount() {
        return this.compCount;
    }
    getLigatureGlyph() {
        return this.ligGlyph;
    }
    getGlyphId(i) {
        return (i === 0) ? this.ligGlyph : this.components[i - 1];
    }
    getComponents() {
        return this.components.slice();
    }
}
