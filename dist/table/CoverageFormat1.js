// UNTESTED
export class CoverageFormat1 {
    glyphCount;
    glyphIds;
    constructor(byte_ar) {
        this.glyphCount = byte_ar.readUnsignedShort();
        this.glyphIds = new Array(this.glyphCount);
        for (let i = 0; i < this.glyphCount; i++) {
            this.glyphIds[i] = byte_ar.readUnsignedShort();
        }
    }
    getFormat() {
        return 1;
    }
    findGlyph(glyphId) {
        for (let i = 0; i < this.glyphCount; i++) {
            if (this.glyphIds[i] === glyphId) {
                return i;
            }
        }
        return -1;
    }
}
