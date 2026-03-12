import { Table } from '../table/Table.js';
export class SVGFont {
    static glyphToPath(glyph, scale, offsetX, offsetY) {
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
    static contourToPath(glyph, startIndex, count, scale, offsetX, offsetY) {
        if (count < 2)
            return "";
        const points = [];
        for (let i = 0; i < count; i++) {
            const point = glyph.getPoint(startIndex + i);
            if (!point)
                break;
            points.push(point);
        }
        if (points.length === 0)
            return "";
        const first = points[0];
        const last = points[points.length - 1];
        const startPoint = first.onCurve
            ? first
            : (last.onCurve
                ? last
                : {
                    x: (last.x + first.x) / 2,
                    y: (last.y + first.y) / 2
                });
        let d = `M ${(startPoint.x * scale) + offsetX} ${(-startPoint.y * scale) + offsetY} `;
        if (points.length < 2)
            return `${d}Z `;
        let index = first.onCurve ? 1 : 0;
        while (index < points.length) {
            const current = points[index];
            const next = points[(index + 1) % points.length];
            if (!current || !next)
                break;
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
    static exportStringSvg(font, text, options = {}) {
        const scale = options.scale ?? 1;
        const letterSpacing = options.letterSpacing ?? 0;
        const stroke = options.stroke ?? "#111";
        const fill = options.fill ?? "none";
        let penX = 0;
        let combinedPath = "";
        if (typeof font.layoutString === 'function') {
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
        }
        else {
            for (const ch of text) {
                const glyph = font.getGlyphByChar(ch);
                if (glyph) {
                    combinedPath += this.glyphToPath(glyph, scale, penX, 0);
                    penX += (glyph.advanceWidth * scale) + letterSpacing;
                }
                else {
                    penX += letterSpacing;
                }
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
    static exportFontSummarySvg(font, options = {}) {
        const head = font.getTableByType(Table.head);
        const unitsPerEm = head?.unitsPerEm ?? 1000;
        const scale = options.scale ?? (1000 / unitsPerEm);
        return this.exportStringSvg(font, "Hello World", { ...options, scale });
    }
}
