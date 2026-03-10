import { FontParserTTF } from '../data/FontParserTTF.js';
import { GlyphData } from '../data/GlyphData.js';
export interface SVGExportOptions {
    scale?: number;
    letterSpacing?: number;
    stroke?: string;
    fill?: string;
}
export declare class SVGFont {
    static glyphToPath(glyph: GlyphData, scale: number, offsetX: number, offsetY: number): string;
    private static contourToPath;
    static exportStringSvg(font: FontParserTTF, text: string, options?: SVGExportOptions): string;
    static exportFontSummarySvg(font: FontParserTTF, options?: SVGExportOptions): string;
}
