import { FontParserTTF } from '../data/FontParserTTF.js';
import { GlyphData } from '../data/GlyphData.js';
import { Table } from '../table/Table.js';

export interface SVGExportOptions {
    scale?: number;
    letterSpacing?: number;
    stroke?: string;
    fill?: string;
}

export class SVGFont {
    static glyphToPath(glyph: GlyphData, scale: number, offsetX: number, offsetY: number): string {
        let d = "";
        let firstindex = 0;
        let counter = 0;

        for (let i = 0; i < glyph.getPointCount(); i++) {
            counter++;
            const point = glyph.getPoint(i);
            if (point && point.endOfContour) {
                d += this.contourToPath(glyph, firstindex, counter, scale, offsetX, offsetY);
                firstindex = i + 1;
                counter = 0;
            }
        }

        return d;
    }

    private static contourToPath(
        glyph: GlyphData,
        startIndex: number,
        count: number,
        scale: number,
        offsetX: number,
        offsetY: number
    ): string {
        const startPoint = glyph.getPoint(startIndex);
        if (!startPoint || startPoint.endOfContour) return "";

        let d = "";
        let offset = 0;

        while (offset < count) {
            const p0 = glyph.getPoint(startIndex + (offset % count));
            const p1 = glyph.getPoint(startIndex + ((offset + 1) % count));
            if (!p0 || !p1) break;

            if (offset === 0) {
                d += `M ${(p0.x * scale) + offsetX} ${(-p0.y * scale) + offsetY} `;
            }

            if (p0.onCurve) {
                if (p1.onCurve) {
                    d += `L ${(p1.x * scale) + offsetX} ${(-p1.y * scale) + offsetY} `;
                    offset++;
                } else {
                    const p2 = glyph.getPoint(startIndex + ((offset + 2) % count));
                    if (!p2) break;
                    if (p2.onCurve) {
                        d += `Q ${(p1.x * scale) + offsetX} ${(-p1.y * scale) + offsetY}, ${(p2.x * scale) + offsetX} ${(-p2.y * scale) + offsetY} `;
                    } else {
                        const mx = (p1.x + p2.x) / 2;
                        const my = (p1.y + p2.y) / 2;
                        d += `Q ${(p1.x * scale) + offsetX} ${(-p1.y * scale) + offsetY}, ${(mx * scale) + offsetX} ${(-my * scale) + offsetY} `;
                    }
                    offset += 2;
                }
            } else {
                if (!p1.onCurve) {
                    const mx = (p0.x + p1.x) / 2;
                    const my = (p0.y + p1.y) / 2;
                    d += `Q ${(p0.x * scale) + offsetX} ${(-p0.y * scale) + offsetY}, ${(mx * scale) + offsetX} ${(-my * scale) + offsetY} `;
                } else {
                    d += `Q ${(p0.x * scale) + offsetX} ${(-p0.y * scale) + offsetY}, ${(p1.x * scale) + offsetX} ${(-p1.y * scale) + offsetY} `;
                }
                offset++;
            }
        }

        d += "Z ";
        return d;
    }

    static exportStringSvg(font: FontParserTTF, text: string, options: SVGExportOptions = {}): string {
        const scale = options.scale ?? 1;
        const letterSpacing = options.letterSpacing ?? 0;
        const stroke = options.stroke ?? "#111";
        const fill = options.fill ?? "none";

        let penX = 0;
        let combinedPath = "";

        for (const ch of text) {
            const glyph = font.getGlyphByChar(ch);
            if (glyph) {
                combinedPath += this.glyphToPath(glyph, scale, penX, 0);
                penX += (glyph.advanceWidth * scale) + letterSpacing;
            } else {
                penX += letterSpacing;
            }
        }

        const ascent = font.getAscent();
        const descent = font.getDescent();
        const height = ascent - descent;

        const width = Math.max(1, penX);
        const viewBox = `0 ${-ascent * scale} ${width} ${height * scale}`;

        return `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height * scale}" viewBox="${viewBox}">` +
            `<path d="${combinedPath}" stroke="${stroke}" fill="${fill}"/>` +
            `</svg>`;
    }

    static exportFontSummarySvg(font: FontParserTTF, options: SVGExportOptions = {}): string {
        const head = font.getTableByType(Table.head) as { unitsPerEm?: number } | null;
        const unitsPerEm = head?.unitsPerEm ?? 1000;
        const scale = options.scale ?? (1000 / unitsPerEm);
        return this.exportStringSvg(font, "Hello World", { ...options, scale });
    }
}
