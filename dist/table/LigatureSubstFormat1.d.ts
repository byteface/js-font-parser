import { ByteArray } from "../utils/ByteArray.js";
import { ICoverage } from "./ICoverage.js";
import { LigatureSet } from "./LigatureSet.js";
export declare class LigatureSubstFormat1 {
    private coverageOffset;
    private ligSetCount;
    private ligatureSetOffsets;
    private coverage;
    private ligatureSets;
    constructor(byteAr: ByteArray, offset: number);
    getFormat(): number;
    getCoverage(): ICoverage | null;
    getLigatureSets(): LigatureSet[];
    tryLigature(glyphs: number[], index: number): {
        glyphId: number;
        length: number;
    } | null;
}
