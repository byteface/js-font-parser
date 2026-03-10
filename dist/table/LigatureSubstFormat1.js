import { Coverage } from "./Coverage.js";
import { LigatureSet } from "./LigatureSet.js";
// import { LigatureSubst } from "./LigatureSubst.js";
// extends LigatureSubst - TODO - may need to make interface? see SingleSubsFormat
export class LigatureSubstFormat1 {
    coverageOffset;
    ligSetCount;
    ligatureSetOffsets;
    coverage;
    ligatureSets;
    constructor(byteAr, offset) {
        this.coverageOffset = byteAr.readUnsignedShort();
        this.ligSetCount = byteAr.readUnsignedShort();
        this.ligatureSetOffsets = new Array(this.ligSetCount);
        this.ligatureSets = new Array(this.ligSetCount);
        for (let i = 0; i < this.ligSetCount; i++) {
            this.ligatureSetOffsets[i] = byteAr.readUnsignedShort();
        }
        byteAr.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byteAr); // Coverage may be null if read fails
        for (let j = 0; j < this.ligSetCount; j++) {
            this.ligatureSets[j] = new LigatureSet(byteAr, offset + this.ligatureSetOffsets[j]);
        }
    }
    getFormat() {
        return 1;
    }
    getCoverage() {
        return this.coverage;
    }
    getLigatureSets() {
        return this.ligatureSets;
    }
    tryLigature(glyphs, index) {
        if (!this.coverage)
            return null;
        const coverageIndex = this.coverage.findGlyph(glyphs[index]);
        if (coverageIndex < 0)
            return null;
        const ligSet = this.ligatureSets[coverageIndex];
        if (!ligSet)
            return null;
        for (const lig of ligSet.getLigatures()) {
            const components = lig.getComponents();
            if (components.length === 0)
                continue;
            let match = true;
            for (let i = 0; i < components.length; i++) {
                if (glyphs[index + 1 + i] !== components[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return { glyphId: lig.getLigatureGlyph(), length: components.length + 1 };
            }
        }
        return null;
    }
}
