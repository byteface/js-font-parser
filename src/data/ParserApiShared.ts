export type SimplePoint = { x: number; y: number; onCurve: boolean; endOfContour: boolean };

export type LayoutItem = {
    glyphIndex: number;
    xAdvance: number;
    xOffset: number;
    yOffset: number;
    yAdvance?: number;
};

export type LayoutPoint = SimplePoint & { glyphIndex: number; pointIndex: number };

export type ColorLayer = { glyphId: number; color: string | null; paletteIndex: number };

type GlyphLike = {
    getPointCount: () => number;
    getPoint: (index: number) => SimplePoint | null | undefined;
};

export function getGlyphPointsByChar(
    char: string,
    options: { sampleStep?: number } | undefined,
    getGlyphByChar: (char: string) => GlyphLike | null
): SimplePoint[] {
    const glyph = getGlyphByChar(char);
    if (!glyph) return [];
    const sampleStep = Math.max(1, Math.floor(options?.sampleStep ?? 1));
    const points: SimplePoint[] = [];
    for (let i = 0; i < glyph.getPointCount(); i += sampleStep) {
        const p = glyph.getPoint(i);
        if (!p) continue;
        points.push({
            x: p.x,
            y: p.y,
            onCurve: p.onCurve,
            endOfContour: p.endOfContour
        });
    }
    return points;
}

export function measureText(
    text: string,
    options: { letterSpacing?: number } | undefined,
    layoutString: (text: string, options: any) => LayoutItem[]
): { advanceWidth: number; glyphCount: number } {
    const layout = layoutString(text, options ?? {});
    const letterSpacing = options?.letterSpacing ?? 0;
    let advanceWidth = 0;
    for (let i = 0; i < layout.length; i++) {
        advanceWidth += layout[i].xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1) advanceWidth += letterSpacing;
    }
    return { advanceWidth, glyphCount: layout.length };
}

export function layoutToPoints(
    text: string,
    options: {
        x?: number;
        y?: number;
        fontSize?: number;
        sampleStep?: number;
        letterSpacing?: number;
    } | undefined,
    deps: {
        layoutString: (text: string, options: any) => LayoutItem[];
        getGlyph: (glyphIndex: number) => GlyphLike | null;
        getUnitsPerEm: () => number;
    }
): { points: LayoutPoint[]; advanceWidth: number; scale: number } {
    const safeOptions = options ?? {};
    const layout = deps.layoutString(text, safeOptions);
    const sampleStep = Math.max(1, Math.floor(safeOptions.sampleStep ?? 1));
    const unitsPerEm = deps.getUnitsPerEm();
    const fontSize = safeOptions.fontSize ?? unitsPerEm;
    const scale = fontSize / unitsPerEm;
    const originX = safeOptions.x ?? 0;
    const originY = safeOptions.y ?? 0;
    const letterSpacing = safeOptions.letterSpacing ?? 0;
    const points: LayoutPoint[] = [];

    let penX = 0;
    for (let i = 0; i < layout.length; i++) {
        const item = layout[i];
        const glyph = deps.getGlyph(item.glyphIndex);
        if (glyph) {
            for (let pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                const p = glyph.getPoint(pIndex);
                if (!p) continue;
                points.push({
                    x: originX + (penX + item.xOffset + p.x) * scale,
                    y: originY - (item.yOffset + p.y) * scale,
                    onCurve: p.onCurve,
                    endOfContour: p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += item.xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1) penX += letterSpacing;
    }

    return { points, advanceWidth: penX, scale };
}

export function getColorLayersForGlyph(
    glyphId: number,
    paletteIndex: number,
    deps: {
        hasColr: boolean;
        getLayersForGlyph: (glyphId: number) => Array<{ glyphId: number; paletteIndex: number }>;
        getPalette: (paletteIndex: number) => Array<{ red: number; green: number; blue: number; alpha: number }>;
    }
): ColorLayer[] {
    if (!deps.hasColr) return [];
    const layers = deps.getLayersForGlyph(glyphId);
    if (layers.length === 0) return [];

    const palette = deps.getPalette(paletteIndex);
    return layers.map(layer => {
        if (layer.paletteIndex === 0xffff) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        const color = palette[layer.paletteIndex];
        if (!color) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        const rgba = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha / 255})`;
        return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
    });
}

export function getColorLayersForChar(
    char: string,
    paletteIndex: number,
    deps: {
        getGlyphIndexByChar: (char: string) => number | null;
        getColorLayersForGlyph: (glyphId: number, paletteIndex: number) => ColorLayer[];
    }
): ColorLayer[] {
    const glyphId = deps.getGlyphIndexByChar(char);
    if (glyphId == null) return [];
    return deps.getColorLayersForGlyph(glyphId, paletteIndex);
}

export function computeVariationCoords(
    axes: Array<{ name: string; minValue: number; defaultValue: number; maxValue: number }>,
    values: Record<string, number>
): number[] {
    const coords: number[] = [];
    for (const axis of axes) {
        const value = values[axis.name] ?? axis.defaultValue;
        let norm = 0;
        if (value !== axis.defaultValue) {
            if (value > axis.defaultValue) {
                const span = axis.maxValue - axis.defaultValue;
                norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
            } else {
                const span = axis.defaultValue - axis.minValue;
                norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
        }
        coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
    }
    return coords;
}
