import { ByteArray } from '../utils/ByteArray.js';
import { GlyphData } from './GlyphData.js';
import { BaseFontParser } from './BaseFontParser.js';
export declare class FontParserTTF extends BaseFontParser {
    private cff2;
    static load(url: string): Promise<FontParserTTF>;
    constructor(byteData: ByteArray);
    private init;
    getGlyph(i: number): GlyphData | null;
    private applyIupDeltas;
    private interpolate;
    protected onVariationCoordsUpdated(coords: number[]): void;
}
