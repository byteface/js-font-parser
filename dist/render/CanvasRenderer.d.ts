import { GlyphData } from '../data/GlyphData.js';
export type CanvasStyleOptions = Partial<{
    fillStyle: string;
    strokeStyle: string;
    globalAlpha: number;
    lineWidth: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
}>;
export type CanvasDrawOptions = {
    scale?: number;
    x?: number;
    y?: number;
    spacing?: number;
    styles?: CanvasStyleOptions;
    paletteIndex?: number;
    fallbackFill?: string;
    kerningScale?: number;
    fallbackAdvance?: number;
    fillRule?: CanvasFillRule;
};
type FontForCanvas = {
    getGlyphByChar: (ch: string) => GlyphData | null;
    getGlyph: (index: number) => GlyphData | null;
    getGlyphIndexByChar?: (ch: string) => number | null;
    getKerningValue?: (left: string, right: string) => number;
    layoutString?: (text: string, options?: Record<string, unknown>) => Array<{
        glyphIndex: number;
        xAdvance: number;
        xOffset?: number;
        yOffset?: number;
    }>;
    layoutStringAuto?: (text: string, options?: Record<string, unknown>) => Array<{
        glyphIndex: number;
        xAdvance: number;
        xOffset?: number;
        yOffset?: number;
    }>;
    getColorLayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{
        glyphId: number;
        color: string | null;
    }>;
    getColrV1LayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{
        glyphId: number;
        color: string | null;
    }>;
};
export declare class CanvasRenderer {
    private static safeNumber;
    private static safeProduct;
    private static getDrawableChars;
    private static getLayout;
    private static getKerningAdjustedLayout;
    static applyCanvasStyles(context: CanvasRenderingContext2D, styles?: CanvasStyleOptions): void;
    static addContourToShape(context: CanvasRenderingContext2D, glyph: GlyphData, startIndex: number, count: number): void;
    static addContourToShapeCubic(context: CanvasRenderingContext2D, glyph: GlyphData, startIndex: number, count: number): void;
    static drawGlyphToContext(context: CanvasRenderingContext2D, glyph: GlyphData | null, options?: CanvasDrawOptions): void;
    static drawString(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    static drawStringWithKerning(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    static drawGlyphIndices(font: FontForCanvas, glyphIndices: number[], canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    static drawColorGlyph(font: FontForCanvas, glyphIndex: number, canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    static drawColorString(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    static drawLayout(font: FontForCanvas, layout: Array<{
        glyphIndex: number;
        xAdvance: number;
        xOffset?: number;
        yOffset?: number;
    }>, canvas: HTMLCanvasElement, options?: CanvasDrawOptions): void;
    private static midValue;
}
export {};
