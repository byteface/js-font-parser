import { Coverage } from "./Coverage.js";
import { LigatureSet } from "./LigatureSet.js";
// import { LigatureSubst } from "./LigatureSubst.js";
// extends LigatureSubst - TODO - may need to make interface? see SingleSubsFormat
var LigatureSubstFormat1 = /** @class */ (function () {
    function LigatureSubstFormat1(byteAr, offset) {
        this.coverageOffset = byteAr.readUnsignedShort();
        this.ligSetCount = byteAr.readUnsignedShort();
        this.ligatureSetOffsets = new Array(this.ligSetCount);
        this.ligatureSets = new Array(this.ligSetCount);
        for (var i = 0; i < this.ligSetCount; i++) {
            this.ligatureSetOffsets[i] = byteAr.readUnsignedShort();
        }
        byteAr.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byteAr); // Coverage may be null if read fails
        for (var j = 0; j < this.ligSetCount; j++) {
            this.ligatureSets[j] = new LigatureSet(byteAr, offset + this.ligatureSetOffsets[j]);
        }
    }
    LigatureSubstFormat1.prototype.getFormat = function () {
        return 1;
    };
    LigatureSubstFormat1.prototype.getCoverage = function () {
        return this.coverage;
    };
    LigatureSubstFormat1.prototype.getLigatureSets = function () {
        return this.ligatureSets;
    };
    LigatureSubstFormat1.prototype.tryLigature = function (glyphs, index) {
        if (!this.coverage)
            return null;
        var coverageIndex = this.coverage.findGlyph(glyphs[index]);
        if (coverageIndex < 0)
            return null;
        var ligSet = this.ligatureSets[coverageIndex];
        if (!ligSet)
            return null;
        for (var _i = 0, _a = ligSet.getLigatures(); _i < _a.length; _i++) {
            var lig = _a[_i];
            var components = lig.getComponents();
            if (components.length === 0)
                continue;
            var match = true;
            for (var i = 0; i < components.length; i++) {
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
    };
    return LigatureSubstFormat1;
}());
export { LigatureSubstFormat1 };
