import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { LigatureSet } from "./LigatureSet.js";
// import { LigatureSubst } from "./LigatureSubst.js";
// extends LigatureSubst - TODO - may need to make interface? see SingleSubsFormat

export class LigatureSubstFormat1 {
    private coverageOffset: number;
    private ligSetCount: number;
    private ligatureSetOffsets: number[];
    private coverage: Coverage | null;
    private ligatureSets: LigatureSet[];

    constructor(byteAr: ByteArray, offset: number) {
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

    public getFormat(): number {
        return 1;
    }
}
