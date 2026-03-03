import { ByteArray } from "../utils/ByteArray.js";
import { Ligature } from "./Ligature.js";

export class LigatureSet {
    private ligatureCount: number;
    private ligatureOffsets: number[];
    private ligatures: Ligature[];

    constructor(byteAr: ByteArray, offset: number) {
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

    public getLigatures(): Ligature[] {
        return this.ligatures;
    }
}
