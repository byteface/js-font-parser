type LayoutGlyph = { glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number; yAdvance?: number };

export function getGlyphPointsByChar(
    char: string,
    options: { sampleStep?: number } = {},
    glyphResolver?: ((char: string) => any | null) | { getGlyphByChar?: (char: string) => any | null }
): Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> {
    const getGlyphByChar = typeof glyphResolver === 'function'
        ? glyphResolver
        : (glyphResolver?.getGlyphByChar?.bind(glyphResolver) ?? null);
    if (!getGlyphByChar) return [];
    let glyph: any = null;
    try {
        glyph = getGlyphByChar(char);
    } catch {
        return [];
    }
    if (!glyph) return [];
    const rawStep = Number.isFinite(options.sampleStep) ? Number(options.sampleStep) : 1;
    const sampleStep = Math.max(1, Math.floor(rawStep));
    const points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> = [];
    let count = 0;
    try {
        count = Number.isFinite(glyph.getPointCount?.()) ? glyph.getPointCount() : 0;
    } catch {
        return [];
    }
    for (let i = 0; i < count; i += sampleStep) {
        let p: any = null;
        try {
            p = glyph.getPoint?.(i);
        } catch {
            continue;
        }
        if (!p) continue;
        points.push({
            x: Number.isFinite(p.x) ? p.x : 0,
            y: Number.isFinite(p.y) ? p.y : 0,
            onCurve: !!p.onCurve,
            endOfContour: !!p.endOfContour
        });
    }
    return points;
}

export function measureText(
    text: string,
    options: { letterSpacing?: number } = {},
    layoutResolver?: ((text: string, options?: any) => LayoutGlyph[] | null) | { layoutString?: (text: string, options?: any) => LayoutGlyph[] | null }
): { advanceWidth: number; glyphCount: number } {
    const layoutString = typeof layoutResolver === 'function'
        ? layoutResolver
        : (layoutResolver?.layoutString?.bind(layoutResolver) ?? null);
    if (!layoutString) return { advanceWidth: 0, glyphCount: 0 };
    let layout: LayoutGlyph[] | null = null;
    try {
        layout = layoutString(text, options);
    } catch {
        return { advanceWidth: 0, glyphCount: 0 };
    }
    if (!Array.isArray(layout)) return { advanceWidth: 0, glyphCount: 0 };
    const letterSpacing = Number.isFinite(options.letterSpacing) ? Number(options.letterSpacing) : 0;
    let advanceWidth = 0;
    for (let i = 0; i < layout.length; i++) {
        const xAdvance = Number.isFinite(layout[i]?.xAdvance) ? Number(layout[i].xAdvance) : 0;
        advanceWidth += xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1) advanceWidth += letterSpacing;
    }
    return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
}

export function layoutToPoints(
    text: string,
    options: {
        x?: number;
        y?: number;
        fontSize?: number;
        sampleStep?: number;
        letterSpacing?: number;
    } = {},
    api?: {
        layoutString?: (text: string, options?: any) => LayoutGlyph[] | null;
        getGlyph?: (glyphIndex: number) => any | null;
        getUnitsPerEm?: () => number;
    }
): {
    points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }>;
    advanceWidth: number;
    scale: number;
} {
    const out = { points: [] as Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }>, advanceWidth: 0, scale: 1 };
    if (!api?.layoutString || !api.getGlyph) return out;
    let layout: LayoutGlyph[] | null = null;
    try {
        layout = api.layoutString(text, options);
    } catch {
        return out;
    }
    if (!Array.isArray(layout)) return out;

    const rawStep = Number.isFinite(options.sampleStep) ? Number(options.sampleStep) : 1;
    const sampleStep = Math.max(1, Math.floor(rawStep));
    let unitsPerEm = 1000;
    try {
        const maybeUpem = api.getUnitsPerEm?.();
        unitsPerEm = Number.isFinite(maybeUpem) && Number(maybeUpem) > 0 ? Number(maybeUpem) : 1000;
    } catch {
        unitsPerEm = 1000;
    }
    const fontSize = Number.isFinite(options.fontSize) && Number(options.fontSize) > 0
        ? Number(options.fontSize)
        : unitsPerEm;
    const scale = fontSize / unitsPerEm;
    const originX = Number.isFinite(options.x) ? Number(options.x) : 0;
    const originY = Number.isFinite(options.y) ? Number(options.y) : 0;
    const letterSpacing = Number.isFinite(options.letterSpacing) ? Number(options.letterSpacing) : 0;
    out.scale = Number.isFinite(scale) ? scale : 1;

    let penX = 0;
    for (let i = 0; i < layout.length; i++) {
        const item = layout[i] ?? { glyphIndex: 0, xAdvance: 0, xOffset: 0, yOffset: 0 };
        let glyph: any = null;
        try {
            glyph = api.getGlyph(item.glyphIndex);
        } catch {
            glyph = null;
        }
        if (glyph) {
            let count = 0;
            try {
                count = Number.isFinite(glyph.getPointCount?.()) ? glyph.getPointCount() : 0;
            } catch {
                count = 0;
            }
            for (let pIndex = 0; pIndex < count; pIndex += sampleStep) {
                let p: any = null;
                try {
                    p = glyph.getPoint?.(pIndex);
                } catch {
                    p = null;
                }
                if (!p) continue;
                out.points.push({
                    x: originX + (penX + (Number.isFinite(item.xOffset) ? Number(item.xOffset) : 0) + (Number.isFinite(p.x) ? p.x : 0)) * out.scale,
                    y: originY - ((Number.isFinite(item.yOffset) ? Number(item.yOffset) : 0) + (Number.isFinite(p.y) ? p.y : 0)) * out.scale,
                    onCurve: !!p.onCurve,
                    endOfContour: !!p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += Number.isFinite(item.xAdvance) ? Number(item.xAdvance) : 0;
        if (letterSpacing !== 0 && i < layout.length - 1) penX += letterSpacing;
    }

    out.advanceWidth = Number.isFinite(penX) ? penX : 0;
    return out;
}

export function getColorLayersForGlyph(
    glyphId: number,
    paletteIndex: number = 0,
    api?: {
        hasColr?: boolean;
        getLayersForGlyph?: (glyphId: number) => Array<{ glyphId: number; paletteIndex: number }> | null;
        getPalette?: (paletteIndex: number) => Array<{ red: number; green: number; blue: number; alpha: number }> | null;
    }
): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
    if (!api?.hasColr || typeof api.getLayersForGlyph !== 'function') return [];
    let layers: Array<{ glyphId: number; paletteIndex: number }> | null = null;
    try {
        layers = api.getLayersForGlyph(glyphId);
    } catch {
        return [];
    }
    if (!Array.isArray(layers) || layers.length === 0) return [];
    let palette: Array<{ red: number; green: number; blue: number; alpha: number }> | null = null;
    try {
        palette = api.getPalette?.(paletteIndex) ?? null;
    } catch {
        palette = null;
    }
    return layers.map((layer) => {
        if (layer.paletteIndex === 0xffff) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        const color = palette?.[layer.paletteIndex];
        if (!color) return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        return {
            glyphId: layer.glyphId,
            color: `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha / 255})`,
            paletteIndex: layer.paletteIndex
        };
    });
}

export function getColorLayersForChar(
    char: string,
    paletteIndex: number = 0,
    api?: {
        getGlyphIndexByChar?: (char: string) => number | null;
        getColorLayersForGlyph?: (glyphId: number, paletteIndex?: number) => Array<{ glyphId: number; color: string | null; paletteIndex: number }> | null;
    }
): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
    if (!api?.getGlyphIndexByChar || !api.getColorLayersForGlyph) return [];
    let glyphId: number | null = null;
    try {
        glyphId = api.getGlyphIndexByChar(char);
    } catch {
        return [];
    }
    if (glyphId == null) return [];
    try {
        const out = api.getColorLayersForGlyph(glyphId, paletteIndex);
        return Array.isArray(out) ? out : [];
    } catch {
        return [];
    }
}

export function computeVariationCoords(
    axes: Array<{ name: string; minValue: number; defaultValue: number; maxValue: number }>,
    values: Record<string, number>
): number[] {
    const coords: number[] = [];
    for (const axis of axes ?? []) {
        const value = values?.[axis.name] ?? axis.defaultValue;
        let norm = 0;
        if (value !== axis.defaultValue) {
            if (value > axis.defaultValue) {
                const span = axis.maxValue - axis.defaultValue;
                norm = Number.isFinite(span) && span !== 0 ? (value - axis.defaultValue) / span : 0;
            } else {
                const span = axis.defaultValue - axis.minValue;
                norm = Number.isFinite(span) && span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
        }
        coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
    }
    return coords;
}
