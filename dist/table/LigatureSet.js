import { Ligature } from "./Ligature.js";
var LigatureSet = /** @class */ (function () {
    function LigatureSet(byteAr, offset) {
        byteAr.offset = offset;
        this.ligatureCount = byteAr.readUnsignedShort();
        this.ligatureOffsets = new Array(this.ligatureCount);
        this.ligatures = new Array(this.ligatureCount);
        for (var i = 0; i < this.ligatureCount; i++) {
            this.ligatureOffsets[i] = byteAr.readUnsignedShort();
        }
        for (var j = 0; j < this.ligatureCount; j++) {
            byteAr.offset = offset + this.ligatureOffsets[j];
            this.ligatures[j] = new Ligature(byteAr);
        }
    }
    return LigatureSet;
}());
export { LigatureSet };
