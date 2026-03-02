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
                this.addContourToShape(context, glyph, firstIndex, counter);
                firstIndex = i + 1;
                counter = 0;
            }
        }
        context.closePath();
        context.stroke();
        context.fill();
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
                kern = font.getKerningValue(ch, text[i + 1]) * scale;
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

    static drawLayout(font: any, layout: Array<{ glyphIndex: number; xAdvance: number; xOffset?: number }>, canvas: HTMLCanvasElement, options: CanvasDrawOptions = {}): void {
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
                y: 0,
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
