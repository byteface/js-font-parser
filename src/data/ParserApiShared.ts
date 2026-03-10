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
    const sampleBase = Number.isFinite(options?.sampleStep) ? (options!.sampleStep as number) : 1;
    const sampleStep = Math.max(1, Math.floor(sampleBase));
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
    let layout: LayoutItem[] = [];
    try {
        const resolved = layoutString(text, options ?? {});
        layout = Array.isArray(resolved) ? resolved as LayoutItem[] : [];
    } catch {
        layout = [];
    }
    const letterSpacing = Number.isFinite(options?.letterSpacing) ? (options!.letterSpacing as number) : 0;
    let advanceWidth = 0;
    for (let i = 0; i < layout.length; i++) {
        const xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
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
    } | undefined,
    deps: {
        layoutString: (text: string, options: any) => LayoutItem[];
        getGlyph: (glyphIndex: number) => GlyphLike | null;
        getUnitsPerEm: () => number;
    }
): { points: LayoutPoint[]; advanceWidth: number; scale: number } {
    const safeOptions = options ?? {};
    let layout: LayoutItem[] = [];
    try {
        const resolved = deps.layoutString(text, safeOptions);
        layout = Array.isArray(resolved) ? resolved as LayoutItem[] : [];
    } catch {
        layout = [];
    }
    const sampleBase = Number.isFinite(safeOptions.sampleStep) ? (safeOptions.sampleStep as number) : 1;
    const sampleStep = Math.max(1, Math.floor(sampleBase));
    let unitsPerEmRaw = 1000;
    try {
        unitsPerEmRaw = deps.getUnitsPerEm();
    } catch {
        unitsPerEmRaw = 1000;
    }
    const unitsPerEm = Number.isFinite(unitsPerEmRaw) && unitsPerEmRaw > 0 ? unitsPerEmRaw : 1000;
    const fontSize = Number.isFinite(safeOptions.fontSize) && (safeOptions.fontSize as number) > 0
        ? (safeOptions.fontSize as number)
        : unitsPerEm;
    const scale = fontSize / unitsPerEm;
    const originX = Number.isFinite(safeOptions.x) ? (safeOptions.x as number) : 0;
    const originY = Number.isFinite(safeOptions.y) ? (safeOptions.y as number) : 0;
    const letterSpacing = Number.isFinite(safeOptions.letterSpacing) ? (safeOptions.letterSpacing as number) : 0;
    const points: LayoutPoint[] = [];

    let penX = 0;
    for (let i = 0; i < layout.length; i++) {
        const item = layout[i];
        let glyph: GlyphLike | null = null;
        try {
            glyph = deps.getGlyph(item.glyphIndex);
        } catch {
            glyph = null;
        }
        if (glyph) {
            let pointCount = 0;
            try {
                pointCount = glyph.getPointCount();
            } catch {
                pointCount = 0;
            }
            for (let pIndex = 0; pIndex < pointCount; pIndex += sampleStep) {
                let p: SimplePoint | null | undefined = null;
                try {
                    p = glyph.getPoint(pIndex);
                } catch {
                    p = null;
                }
                if (!p) continue;
                points.push({
                    x: originX + (penX + (Number.isFinite(item.xOffset) ? item.xOffset : 0) + p.x) * scale,
                    y: originY - ((Number.isFinite(item.yOffset) ? item.yOffset : 0) + p.y) * scale,
                    onCurve: p.onCurve,
                    endOfContour: p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += Number.isFinite(item.xAdvance) ? item.xAdvance : 0;
        if (letterSpacing !== 0 && i < layout.length - 1) penX += letterSpacing;
    }

    return {
        points,
        advanceWidth: Number.isFinite(penX) ? penX : 0,
        scale: Number.isFinite(scale) ? scale : 1
    };
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
    let layers: Array<{ glyphId: number; paletteIndex: number }> = [];
    try {
        const resolved = deps.getLayersForGlyph(glyphId);
        layers = Array.isArray(resolved) ? resolved : [];
    } catch {
        layers = [];
    }
    if (layers.length === 0) return [];

    let paletteRaw: Array<{ red: number; green: number; blue: number; alpha: number }> | null = [];
    try {
        paletteRaw = deps.getPalette(paletteIndex);
    } catch {
        paletteRaw = [];
    }
    const palette = Array.isArray(paletteRaw) ? paletteRaw : [];
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
    let glyphId: number | null = null;
    try {
        glyphId = deps.getGlyphIndexByChar(char);
    } catch {
        glyphId = null;
    }
    if (glyphId == null) return [];
    try {
        const layers = deps.getColorLayersForGlyph(glyphId, paletteIndex);
        return Array.isArray(layers) ? layers : [];
    } catch {
        return [];
    }
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
