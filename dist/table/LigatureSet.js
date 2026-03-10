import { Ligature } from "./Ligature.js";
export class LigatureSet {
    ligatureCount;
    ligatureOffsets;
    ligatures;
    constructor(byteAr, offset) {
        byteAr.offset = offset;
        this.ligatureCount = byteAr.readUnsignedShort();
        this.ligatureOffsets = new Array(this.ligatureCount);
        this.ligatures = new Array(this.ligatureCount);
        for (let i = 0; i < this.ligatureCount; i++) {
            this.ligatureOffsets[i] = byteAr.readUnsignedShort();
        }
        for (let j = 0; j < this.ligatureCount; j++) {
            byteAr.offset = offset + this.ligatureOffsets[j];
            this.ligatures[j] = new Ligature(byteAr);
        }
    }
    getLigatures() {
        return this.ligatures;
    }
}
