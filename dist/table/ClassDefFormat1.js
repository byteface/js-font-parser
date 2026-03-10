import { ClassDef } from "./ClassDef.js";
export class ClassDefFormat1 extends ClassDef {
    startGlyph;
    glyphCount;
    classValues;
    constructor(byte_ar) {
        super();
        this.startGlyph = byte_ar.readUnsignedShort();
        this.glyphCount = byte_ar.readUnsignedShort();
        this.classValues = new Array(this.glyphCount);
        for (let i = 0; i < this.glyphCount; i++) {
            this.classValues[i] = byte_ar.readUnsignedShort();
        }
    }
    getFormat() {
        return 1;
    }
    getGlyphClass(glyphId) {
        const index = glyphId - this.startGlyph;
        if (index < 0 || index >= this.glyphCount)
            return 0;
        return this.classValues[index] ?? 0;
    }
}
