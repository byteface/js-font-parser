import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class PostTable implements ITable {
    private static readonly MAC_GLYPH_NAMES;
    private static readonly TEXT_DECODER;
    version: number;
    italicAngle: number;
    underlinePosition: number;
    underlineThickness: number;
    isFixedPitch: number;
    minMemType42: number;
    maxMemType42: number;
    minMemType1: number;
    maxMemType1: number;
    numGlyphs: number;
    glyphNameIndex: number[] | null;
    psGlyphName: string[] | null;
    private data;
    private glyphNamesOffset;
    private glyphNamesLoaded;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    highestGlyphNameIndex(): number;
    getGlyphName(i: number): string | null;
    getType(): number;
    private ensureGlyphNamesLoaded;
}
