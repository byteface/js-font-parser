import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
import { GsubMatchContext } from "./GsubMatch.js";
export declare class ContextSubstFormat3 extends LookupSubtable {
    private glyphCount;
    private lookupCount;
    private coverages;
    private records;
    private gsub;
    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable);
    applyToGlyphs(glyphs: number[]): number[];
    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[];
}
