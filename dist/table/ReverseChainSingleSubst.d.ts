import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubMatchContext } from "./GsubMatch.js";
export declare class ReverseChainSingleSubst extends LookupSubtable {
    private coverage;
    private backtrackCoverages;
    private lookaheadCoverages;
    private substitutes;
    constructor(byte_ar: ByteArray, offset: number);
    applyToGlyphs(glyphs: number[]): number[];
    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[];
}
