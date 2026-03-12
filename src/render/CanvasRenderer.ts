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
    layoutString?: (text: string, options?: Record<string, unknown>) => Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>;
    layoutStringAuto?: (text: string, options?: Record<string, unknown>) => Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>;
    getColorLayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{ glyphId: number; color: string | null }>;
    getColrV1LayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{ glyphId: number; color: string | null }>;
};

type PositionedGlyphLike = { glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number };

export class CanvasRenderer {
    private static safeNumber(value: number | undefined, fallback: number): number {
        return Number.isFinite(value) ? (value as number) : fallback;
    }

    private static safeProduct(a: number, b: number, fallback = 0): number {
        const product = a * b;
        return Number.isFinite(product) ? product : fallback;
    }

    private static getDrawableChars(font: FontForCanvas, text: string): string[] {
        const chars: string[] = [];
        for (const ch of Array.from(text)) {
            try {
                if (font.getGlyphByChar(ch)) chars.push(ch);
            } catch {
                // Skip characters that fail glyph resolution during rendering.
            }
        }
        return chars;
    }

    private static getLayout(
        font: FontForCanvas,
        text: string,
        options: Record<string, unknown> = { gpos: true }
    ): PositionedGlyphLike[] | null {
        try {
            if (typeof font.layoutStringAuto === 'function') {
                return font.layoutStringAuto(text, options) ?? null;
            }
            if (typeof font.layoutString === 'function') {
                return font.layoutString(text, options) ?? null;
            }
        } catch {
            return null;
        }
        return null;
    }

    private static getKerningAdjustedLayout(
        font: FontForCanvas,
        text: string,
        spacing: number,
        kerningScale: number
    ): PositionedGlyphLike[] | null {
        const kerned = this.getLayout(font, text, { gpos: true, kerning: true });
        if (!Array.isArray(kerned) || kerned.length === 0) return null;

        const markLayout = this.getLayout(font, text, { gpos: true, kerning: false });
        const base = (kerningScale === 1 && spacing === 0)
            ? kerned
            : (Array.isArray(markLayout) && markLayout.length === kerned.length ? markLayout : kerned);

        if (!Array.isArray(base) || base.length !== kerned.length) {
            return kerned.map((item, index) => ({
                ...item,
                xAdvance: item.xAdvance + (index < kerned.length - 1 ? spacing : 0)
            }));
        }

        return kerned.map((item, index) => {
            const baseItem = base[index];
            const withSpacing = index < kerned.length - 1 ? spacing : 0;
            return {
                glyphIndex: item.glyphIndex,
                xAdvance: baseItem.xAdvance + ((item.xAdvance - baseItem.xAdvance) * kerningScale) + withSpacing,
                xOffset: (baseItem.xOffset ?? 0) + (((item.xOffset ?? 0) - (baseItem.xOffset ?? 0)) * kerningScale),
                yOffset: (baseItem.yOffset ?? 0) + (((item.yOffset ?? 0) - (baseItem.yOffset ?? 0)) * kerningScale)
            };
        });
    }

    static applyCanvasStyles(context: CanvasRenderingContext2D, styles?: CanvasStyleOptions): void {
        if (!styles) return;
        if (styles.fillStyle != null) context.fillStyle = styles.fillStyle;
        if (styles.strokeStyle != null) context.strokeStyle = styles.strokeStyle;
        if (styles.globalAlpha != null) context.globalAlpha = styles.globalAlpha;
        if (styles.lineWidth != null) context.lineWidth = styles.lineWidth;
        if (styles.shadowColor != null) context.shadowColor = styles.shadowColor;
        if (styles.shadowBlur != null) context.shadowBlur = styles.shadowBlur;
        if (styles.shadowOffsetX != null) context.shadowOffsetX = styles.shadowOffsetX;
        if (styles.shadowOffsetY != null) context.shadowOffsetY = styles.shadowOffsetY;
    }

    static addContourToShape(context: CanvasRenderingContext2D, glyph: GlyphData, startIndex: number, count: number): void {
        if (count < 2) return;

        const points: Array<ReturnType<GlyphData['getPoint']>> = [];
        for (let i = 0; i < count; i++) {
            const point = glyph.getPoint(startIndex + i);
            if (!point) return;
            points.push(point);
        }
        if (points.length === 0) return;

        const first = points[0]!;
        const last = points[points.length - 1]!;
        const startPoint = first.onCurve
            ? first
            : (last.onCurve
                ? last
                : {
                    x: this.midValue(last.x, first.x),
                    y: this.midValue(last.y, first.y)
                });

        context.moveTo(startPoint.x, startPoint.y);

        let index = first.onCurve ? 1 : 0;
        while (index < points.length) {
            const current = points[index];
            const next = points[(index + 1) % points.length];
            if (!current || !next) break;

            if (current.onCurve) {
                context.lineTo(current.x, current.y);
                index += 1;
                continue;
            }

            if (next.onCurve) {
                context.quadraticCurveTo(current.x, current.y, next.x, next.y);
                index += 2;
                continue;
            }

            context.quadraticCurveTo(
                current.x,
                current.y,
                this.midValue(current.x, next.x),
                this.midValue(current.y, next.y)
            );
            index += 1;
        }
    }

    static addContourToShapeCubic(context: CanvasRenderingContext2D, glyph: GlyphData, startIndex: number, count: number): void {
        if (glyph.getPoint(startIndex)?.endOfContour) return;

        let offset = 0;
        while (offset < count) {
            const p0 = glyph.getPoint(startIndex + (offset % count));
            const p1 = glyph.getPoint(startIndex + ((offset + 1) % count));
            if (!p0 || !p1) break;

            if (offset === 0) {
                context.moveTo(p0.x, p0.y);
            }

            if (p1.onCurve) {
                context.lineTo(p1.x, p1.y);
                offset += 1;
                continue;
            }

            const p2 = glyph.getPoint(startIndex + ((offset + 2) % count));
            const p3 = glyph.getPoint(startIndex + ((offset + 3) % count));
            if (p2 && !p2.onCurve && p3 && p3.onCurve) {
                context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
                offset += 3;
                continue;
            }

            if (p2 && p2.onCurve) {
                // Treat as cubic with duplicated control point to avoid quadratic artifacts in CFF
                context.bezierCurveTo(p1.x, p1.y, p1.x, p1.y, p2.x, p2.y);
                offset += 2;
                continue;
            }

            context.lineTo(p1.x, p1.y);
            offset += 1;
        }
    }

    static drawGlyphToContext(
        context: CanvasRenderingContext2D,
        glyph: GlyphData | null,
        options: CanvasDrawOptions = {}
    ): void {
        if (!glyph) return;

        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);

        context.save();
        context.translate(x, y);
        context.scale(scale, -scale);

        this.applyCanvasStyles(context, options.styles);

        context.beginPath();
        let firstIndex = 0;
        let counter = 0;
        for (let i = 0; i < glyph.getPointCount(); i++) {
            counter++;
            if (glyph.getPoint(i)?.endOfContour) {
                if (glyph.isCubic) {
                    this.addContourToShapeCubic(context, glyph, firstIndex, counter);
                } else {
                    this.addContourToShape(context, glyph, firstIndex, counter);
                }
                context.closePath();
                firstIndex = i + 1;
                counter = 0;
            }
        }
        context.stroke();
        if (options.fillRule) {
            context.fill(options.fillRule);
        } else {
            // CFF/CFF2 outlines use nonzero winding by default
            context.fill();
        }
        context.restore();
    }

    static drawString(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const spacing = this.safeNumber(options.spacing, 0);
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const ch of this.getDrawableChars(font, text)) {
            const glyph = font.getGlyphByChar(ch);
            if (!glyph) continue;
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale,
                styles: options.styles
            });
            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing;
        }

        context.restore();
    }

    static drawStringWithKerning(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const spacing = this.safeNumber(options.spacing, 0);
        const kerningScale = this.safeNumber(options.kerningScale, 1);
        const context = canvas.getContext('2d');
        if (!context) return;
        const spacingUnits = scale === 0 ? 0 : spacing / scale;
        const shapedLayout = this.getKerningAdjustedLayout(font, text, spacingUnits, kerningScale);
        if (Array.isArray(shapedLayout) && shapedLayout.length > 0) {
            this.drawLayout(font, shapedLayout, canvas, options);
            return;
        }
        const chars = this.getDrawableChars(font, text);

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            const glyph = font.getGlyphByChar(ch);
            if (!glyph) continue;

            let kern = 0;
            if (i < chars.length - 1 && typeof font.getKerningValue === 'function') {
                try {
                    const rawKern = font.getKerningValue(ch, chars[i + 1]);
                    kern = this.safeProduct(this.safeProduct(rawKern, scale), kerningScale);
                } catch {
                    kern = 0;
                }
            }

            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale,
                styles: options.styles
            });

            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing + kern;
        }

        context.restore();
    }

    static drawGlyphIndices(font: FontForCanvas, glyphIndices: number[], canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const spacing = this.safeNumber(options.spacing, 0);
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const idx of glyphIndices) {
            const glyph = font.getGlyph(idx);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale,
                styles: options.styles
            });
            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing;
        }

        context.restore();
    }

    static drawColorGlyph(
        font: FontForCanvas,
        glyphIndex: number,
        canvas: HTMLCanvasElement,
        options: CanvasDrawOptions = {}
    ): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const context = canvas.getContext('2d');
        if (!context) return;

        const paletteIndex = this.safeNumber(options.paletteIndex, 0);
        let layers: Array<{ glyphId: number; color: string | null }> = [];
        if (typeof font.getColorLayersForGlyph === 'function') {
            try {
                layers = font.getColorLayersForGlyph(glyphIndex, paletteIndex) ?? [];
            } catch {
                layers = [];
            }
        }
        if ((!layers || layers.length === 0) && typeof font.getColrV1LayersForGlyph === 'function') {
            try {
                layers = font.getColrV1LayersForGlyph(glyphIndex, paletteIndex) ?? [];
            } catch {
                layers = [];
            }
        }

        if (!layers || layers.length === 0) {
            const glyph = font.getGlyph(glyphIndex);
            if (!glyph) return;
            this.drawGlyphToContext(context, glyph, { x, y, scale, styles: options.styles });
            return;
        }

        for (const layer of layers) {
            const glyph = font.getGlyph(layer.glyphId);
            if (!glyph) continue;
            const fill = layer.color ?? options.fallbackFill ?? options.styles?.fillStyle ?? '#111';
            this.drawGlyphToContext(context, glyph, {
                x,
                y,
                scale,
                styles: {
                    fillStyle: fill,
                    strokeStyle: 'rgba(0,0,0,0)',
                    lineWidth: 0
                }
            });
        }
    }

    static drawColorString(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const spacing = this.safeNumber(options.spacing, 0);
        const paletteIndex = this.safeNumber(options.paletteIndex, 0);
        const fallbackAdvance = this.safeNumber(options.fallbackAdvance, 0);
        const context = canvas.getContext('2d');
        if (!context) return;
        const shapedLayout = this.getLayout(font, text);
        if (Array.isArray(shapedLayout) && shapedLayout.length > 0) {
            const adjustedLayout = spacing === 0
                ? shapedLayout
                : shapedLayout.map((item, index) => ({
                    ...item,
                    xAdvance: item.xAdvance + ((index < shapedLayout.length - 1 ? spacing : 0) / scale)
                }));

            let cursorX = x;
            context.save();
            context.translate(0, y);
            for (const item of adjustedLayout) {
                this.drawColorGlyph(font, item.glyphIndex, canvas, {
                    x: cursorX + this.safeProduct(this.safeNumber(item.xOffset, 0), scale),
                    y: this.safeProduct(this.safeNumber(item.yOffset, 0), scale),
                    scale,
                    paletteIndex,
                    fallbackFill: options.fallbackFill,
                    styles: options.styles
                });
                cursorX += this.safeProduct(this.safeNumber(item.xAdvance, 0), scale);
            }
            context.restore();
            return;
        }

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const ch of Array.from(text)) {
            const glyphIndex = typeof font.getGlyphIndexByChar === 'function'
                ? font.getGlyphIndexByChar(ch)
                : null;

            if (glyphIndex == null) {
                cursorX += spacing;
                continue;
            }

            this.drawColorGlyph(font, glyphIndex, canvas, {
                x: cursorX,
                y: 0,
                scale,
                paletteIndex,
                fallbackFill: options.fallbackFill,
                styles: options.styles
            });

            const glyph = font.getGlyph(glyphIndex);
            const advance = glyph?.advanceWidth ?? 0;
            const effectiveAdvance = advance > 0 ? advance : fallbackAdvance;
            cursorX += this.safeProduct(effectiveAdvance, scale) + spacing;
        }

        context.restore();
    }

    static drawLayout(font: FontForCanvas, layout: Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const item of layout) {
            const glyph = font.getGlyph(item.glyphIndex);
            if (!glyph) continue;
            const xOffset = this.safeNumber(item.xOffset, 0);
            const yOffset = this.safeNumber(item.yOffset, 0);
            const xAdvance = this.safeNumber(item.xAdvance, 0);
            this.drawGlyphToContext(context, glyph, {
                x: cursorX + this.safeProduct(xOffset, scale),
                y: this.safeProduct(yOffset, scale),
                scale,
                styles: options.styles
            });
            cursorX += this.safeProduct(xAdvance, scale);
        }

        context.restore();
    }

    private static midValue(a: number, b: number): number {
        return (a + b) / 2;
    }
}
