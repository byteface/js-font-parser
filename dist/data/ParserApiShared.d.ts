type LayoutGlyph = {
    glyphIndex: number;
    xAdvance: number;
    xOffset?: number;
    yOffset?: number;
    yAdvance?: number;
};
export declare function getGlyphPointsByChar(char: string, options?: {
    sampleStep?: number;
}, glyphResolver?: ((char: string) => any | null) | {
    getGlyphByChar?: (char: string) => any | null;
}): Array<{
    x: number;
    y: number;
    onCurve: boolean;
    endOfContour: boolean;
}>;
export declare function measureText(text: string, options?: {
    letterSpacing?: number;
}, layoutResolver?: ((text: string, options?: any) => LayoutGlyph[] | null) | {
    layoutString?: (text: string, options?: any) => LayoutGlyph[] | null;
}): {
    advanceWidth: number;
    glyphCount: number;
};
export declare function layoutToPoints(text: string, options?: {
    x?: number;
    y?: number;
    fontSize?: number;
    sampleStep?: number;
    letterSpacing?: number;
}, api?: {
    layoutString?: (text: string, options?: any) => LayoutGlyph[] | null;
    getGlyph?: (glyphIndex: number) => any | null;
    getUnitsPerEm?: () => number;
}): {
    points: Array<{
        x: number;
        y: number;
        onCurve: boolean;
        endOfContour: boolean;
        glyphIndex: number;
        pointIndex: number;
    }>;
    advanceWidth: number;
    scale: number;
};
export declare function getColorLayersForGlyph(glyphId: number, paletteIndex?: number, api?: {
    hasColr?: boolean;
    getLayersForGlyph?: (glyphId: number) => Array<{
        glyphId: number;
        paletteIndex: number;
    }> | null;
    getPalette?: (paletteIndex: number) => Array<{
        red: number;
        green: number;
        blue: number;
        alpha: number;
    }> | null;
}): Array<{
    glyphId: number;
    color: string | null;
    paletteIndex: number;
}>;
export declare function getColorLayersForChar(char: string, paletteIndex?: number, api?: {
    getGlyphIndexByChar?: (char: string) => number | null;
    getColorLayersForGlyph?: (glyphId: number, paletteIndex?: number) => Array<{
        glyphId: number;
        color: string | null;
        paletteIndex: number;
    }> | null;
}): Array<{
    glyphId: number;
    color: string | null;
    paletteIndex: number;
}>;
export declare function computeVariationCoords(axes: Array<{
    name: string;
    minValue: number;
    defaultValue: number;
    maxValue: number;
}>, values: Record<string, number>): number[];
export {};
