// UNTESTED
import { Coverage } from './Coverage.js';
export class SingleSubstFormat1 {
    coverageOffset;
    deltaGlyphID;
    coverage;
    constructor(byte_ar, offset) {
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.deltaGlyphID = byte_ar.readShort();
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }
    getFormat() {
        return 1;
    }
    substitute(glyphId) {
        if (this.coverage) {
            const i = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return glyphId + this.deltaGlyphID;
            }
        }
        return glyphId;
    }
}
