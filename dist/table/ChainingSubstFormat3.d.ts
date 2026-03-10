import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
import { GsubMatchContext } from "./GsubMatch.js";
export declare class ChainingSubstFormat3 extends LookupSubtable {
    private backtrackCount;
    private inputCount;
    private lookaheadCount;
    private backtrackCoverages;
    private inputCoverages;
    private lookaheadCoverages;
    private records;
    private gsub;
    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable);
    applyToGlyphs(glyphs: number[]): number[];
    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[];
}
