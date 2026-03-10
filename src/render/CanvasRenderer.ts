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
    getColorLayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{ glyphId: number; color: string | null }>;
    getColrV1LayersForGlyph?: (glyphIndex: number, paletteIndex?: number) => Array<{ glyphId: number; color: string | null }>;
};

export class CanvasRenderer {
    private static safeNumber(value: number | undefined, fallback: number): number {
        return Number.isFinite(value) ? (value as number) : fallback;
    }

    private static safeProduct(a: number, b: number, fallback = 0): number {
        const product = a * b;
        return Number.isFinite(product) ? product : fallback;
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
        if (glyph.getPoint(startIndex)?.endOfContour) return;

        let offset = 0;
        while (offset < count) {
            const p0 = glyph.getPoint(startIndex + offset % count);
            const p1 = glyph.getPoint(startIndex + (offset + 1) % count);
            if (!p0 || !p1) break;

            if (offset === 0) {
                context.moveTo(p0.x, p0.y);
            }

            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo(p1.x, p1.y);
                    offset++;
                } else {
                    const p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (!p2) break;
                    if (p2.onCurve) {
                        context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    } else {
                        context.quadraticCurveTo(p1.x, p1.y, this.midValue(p1.x, p2.x), this.midValue(p1.y, p2.y));
                    }
                    offset += 2;
                }
            } else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(p0.x, p0.y, this.midValue(p0.x, p1.x), this.midValue(p0.y, p1.y));
                } else {
                    context.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y);
                }
                offset++;
            }
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

        for (const ch of Array.from(text)) {
            const glyph = font.getGlyphByChar(ch);
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

    static drawStringWithKerning(font: FontForCanvas, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = this.safeNumber(options.scale, 0.1);
        const x = this.safeNumber(options.x, 0);
        const y = this.safeNumber(options.y, 0);
        const spacing = this.safeNumber(options.spacing, 0);
        const kerningScale = this.safeNumber(options.kerningScale, 1);
        const context = canvas.getContext('2d');
        if (!context) return;
        const chars = Array.from(text);

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            const glyph = font.getGlyphByChar(ch);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }

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
