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
    private static escapeXmlAttr(value: string | number): string {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

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
        if (count < 2) return "";

        const points: GlyphData['points'] = [];
        for (let i = 0; i < count; i++) {
            const point = glyph.getPoint(startIndex + i);
            if (!point) break;
            points.push(point);
        }
        if (points.length === 0) return "";

        const first = points[0]!;
        const last = points[points.length - 1]!;
        const startPoint = first.onCurve
            ? first
            : (last.onCurve
                ? last
                : {
                    x: (last.x + first.x) / 2,
                    y: (last.y + first.y) / 2
                });

        let d = `M ${(startPoint.x * scale) + offsetX} ${(-startPoint.y * scale) + offsetY} `;
        if (points.length < 2) return `${d}Z `;
        let index = first.onCurve ? 1 : 0;

        while (index < points.length) {
            const current = points[index];
            const next = points[(index + 1) % points.length];
            if (!current || !next) break;

            if (current.onCurve) {
                d += `L ${(current.x * scale) + offsetX} ${(-current.y * scale) + offsetY} `;
                index += 1;
                continue;
            }

            if (next.onCurve) {
                d += `Q ${(current.x * scale) + offsetX} ${(-current.y * scale) + offsetY}, ${(next.x * scale) + offsetX} ${(-next.y * scale) + offsetY} `;
                index += 2;
                continue;
            }

            const mx = (current.x + next.x) / 2;
            const my = (current.y + next.y) / 2;
            d += `Q ${(current.x * scale) + offsetX} ${(-current.y * scale) + offsetY}, ${(mx * scale) + offsetX} ${(-my * scale) + offsetY} `;
            index += 1;
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
        if (typeof (font as FontParserTTF & { layoutString?: (text: string, options?: Record<string, unknown>) => Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }> }).layoutString === 'function') {
            const layout = font.layoutString(text, { gpos: true });
            for (let i = 0; i < layout.length; i++) {
                const item = layout[i];
                const glyph = font.getGlyph(item.glyphIndex);
                if (glyph) {
                    const offsetX = penX + ((item.xOffset ?? 0) * scale);
                    const offsetY = (item.yOffset ?? 0) * scale;
                    combinedPath += this.glyphToPath(glyph, scale, offsetX, offsetY);
                }
                penX += (item.xAdvance * scale);
                if (letterSpacing !== 0 && i < layout.length - 1) {
                    penX += letterSpacing;
                }
            }
        } else {
            for (const ch of text) {
                const glyph = font.getGlyphByChar(ch);
                if (glyph) {
                    combinedPath += this.glyphToPath(glyph, scale, penX, 0);
                    penX += (glyph.advanceWidth * scale) + letterSpacing;
                } else {
                    penX += letterSpacing;
                }
            }
        }

        const ascent = font.getAscent();
        const descent = font.getDescent();
        const height = ascent - descent;

        const width = Math.max(1, penX);
        const viewBox = `0 ${-ascent * scale} ${width} ${height * scale}`;
        const safeWidth = this.escapeXmlAttr(width);
        const safeHeight = this.escapeXmlAttr(height * scale);
        const safeViewBox = this.escapeXmlAttr(viewBox);
        const safePath = this.escapeXmlAttr(combinedPath);
        const safeStroke = this.escapeXmlAttr(stroke);
        const safeFill = this.escapeXmlAttr(fill);

        return `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="${safeViewBox}">` +
            `<path d="${safePath}" stroke="${safeStroke}" fill="${safeFill}"/>` +
            `</svg>`;
    }

    static exportFontSummarySvg(font: FontParserTTF, options: SVGExportOptions = {}): string {
        const head = font.getTableByType(Table.head) as { unitsPerEm?: number } | null;
        const unitsPerEm = head?.unitsPerEm ?? 1000;
        const scale = options.scale ?? (1000 / unitsPerEm);
        return this.exportStringSvg(font, "Hello World", { ...options, scale });
    }
}
