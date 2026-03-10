import { ByteArray } from '../utils/ByteArray.js';
import { GlyphData } from './GlyphData.js';
import { BaseFontParser } from './BaseFontParser.js';
export declare class FontParserWOFF extends BaseFontParser {
    private static readonly WOFF_SIGNATURE;
    constructor(byteData: ByteArray, options?: {
        format?: 'woff' | 'sfnt';
    });
    static load(url: string): Promise<FontParserWOFF>;
    private init;
    private static readUint32;
    private static readUint16;
    private static assertNonOverlappingTableRanges;
    private static decodeWoffToSfntSync;
    private static inflate;
    private static decodeWoffToSfnt;
    private parseTTF;
    getGlyph(i: number): GlyphData | null;
    private applyIupDeltas;
    private interpolate;
}
