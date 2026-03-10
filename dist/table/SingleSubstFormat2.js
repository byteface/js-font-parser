// UNTESTED
import { Coverage } from './Coverage.js';
export class SingleSubstFormat2 {
    coverageOffset;
    glyphCount;
    substitutes;
    coverage;
    constructor(byte_ar, offset) {
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.glyphCount = byte_ar.readUnsignedShort();
        this.substitutes = new Array(this.glyphCount);
        for (let i = 0; i < this.glyphCount; i++) {
            this.substitutes[i] = byte_ar.readUnsignedShort();
        }
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }
    getFormat() {
        return 2;
    }
    substitute(glyphId) {
        if (this.coverage) {
            const i = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return this.substitutes[i];
            }
        }
        return glyphId;
    }
}
