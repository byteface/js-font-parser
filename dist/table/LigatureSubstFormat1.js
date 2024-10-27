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
    return LigatureSubstFormat1;
}());
export { LigatureSubstFormat1 };
