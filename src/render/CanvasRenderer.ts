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

export class CanvasRenderer {
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

        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;

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
        } else if (glyph.isCubic) {
            context.fill("evenodd");
        } else {
            context.fill();
        }
        context.restore();
    }

    static drawString(font: any, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const spacing = options.spacing ?? 0;
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const ch of text) {
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
            cursorX += glyph.advanceWidth * scale + spacing;
        }

        context.restore();
    }

    static drawStringWithKerning(font: any, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const spacing = options.spacing ?? 0;
        const kerningScale = options.kerningScale ?? 1;
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const glyph = font.getGlyphByChar(ch);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }

            let kern = 0;
            if (i < text.length - 1 && typeof font.getKerningValue === 'function') {
                kern = font.getKerningValue(ch, text[i + 1]) * scale * kerningScale;
            }

            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale,
                styles: options.styles
            });

            cursorX += glyph.advanceWidth * scale + spacing + kern;
        }

        context.restore();
    }

    static drawGlyphIndices(font: any, glyphIndices: number[], canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const spacing = options.spacing ?? 0;
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
            cursorX += glyph.advanceWidth * scale + spacing;
        }

        context.restore();
    }

    static drawColorGlyph(
        font: any,
        glyphIndex: number,
        canvas: HTMLCanvasElement,
        options: CanvasDrawOptions = {}
    ): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const context = canvas.getContext('2d');
        if (!context) return;

        const layers = typeof font.getColorLayersForGlyph === 'function'
            ? font.getColorLayersForGlyph(glyphIndex, options.paletteIndex ?? 0)
            : [];

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

    static drawColorString(font: any, text: string, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const spacing = options.spacing ?? 0;
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
                paletteIndex: options.paletteIndex,
                fallbackFill: options.fallbackFill,
                styles: options.styles
            });

            const glyph = font.getGlyph(glyphIndex);
            const advance = glyph?.advanceWidth ?? 0;
            const fallbackAdvance = options.fallbackAdvance ?? 0;
            cursorX += (advance > 0 ? advance : fallbackAdvance) * scale + spacing;
        }

        context.restore();
    }

    static drawLayout(font: any, layout: Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
        const scale = options.scale ?? 0.1;
        const x = options.x ?? 0;
        const y = options.y ?? 0;
        const context = canvas.getContext('2d');
        if (!context) return;

        let cursorX = x;
        context.save();
        context.translate(0, y);

        for (const item of layout) {
            const glyph = font.getGlyph(item.glyphIndex);
            if (!glyph) continue;
            this.drawGlyphToContext(context, glyph, {
                x: cursorX + (item.xOffset ?? 0) * scale,
                y: (item.yOffset ?? 0) * scale,
                scale,
                styles: options.styles
            });
            cursorX += (item.xAdvance ?? 0) * scale;
        }

        context.restore();
    }

    private static midValue(a: number, b: number): number {
        return (a + b) / 2;
    }
}
