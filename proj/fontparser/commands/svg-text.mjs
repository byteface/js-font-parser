import { SVGFont } from "../../../dist/render/SVGFont.js";
import { Table } from "../../../dist/table/Table.js";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportSvgText(font, text, options = {}) {
  const lines = String(text).replace(/\\n/g, "\n").split("\n");
  const head = font.getTableByType(Table.head);
  const unitsPerEm = head?.unitsPerEm ?? 1000;
  const ascent = font.getAscent();
  const descent = font.getDescent();

  const fontSize = options.fontSize ?? 96;
  const scale = fontSize / unitsPerEm;
  const lineHeightFactor = options.lineHeight ?? 1.2;
  const letterSpacing = options.letterSpacing ?? 0;
  const useKerning = options.useKerning ?? true;
  const padding = options.padding ?? 24;
  const fill = options.fill ?? "#111111";
  const stroke = options.stroke ?? "none";
  const strokeWidth = options.strokeWidth ?? 0;
  const background = options.background ?? null;

  const fontHeightPx = (ascent - descent) * scale;
  const lineHeightPx = Math.max(fontHeightPx, fontHeightPx * lineHeightFactor);

  const lineAdvances = [];
  const linePaths = [];
  for (const line of lines) {
    let penX = 0;
    let pathD = "";
    let prev = null;
    for (const ch of line) {
      const glyph = font.getGlyphByChar(ch);
      if (!glyph) {
        penX += letterSpacing + (fontSize * 0.33);
        prev = null;
        continue;
      }
      if (useKerning && prev != null) {
        const kern = font.getKerningValue(prev, ch) || 0;
        penX += kern * scale;
      }
      pathD += SVGFont.glyphToPath(glyph, scale, penX, 0);
      penX += glyph.advanceWidth * scale + letterSpacing;
      prev = ch;
    }
    lineAdvances.push(Math.max(1, penX));
    linePaths.push(pathD);
  }

  const width = Math.ceil(Math.max(1, ...lineAdvances) + padding * 2);
  const height = Math.ceil(Math.max(1, lines.length * lineHeightPx) + padding * 2);
  const viewBox = `0 0 ${width} ${height}`;

  const pathEls = [];
  for (let i = 0; i < linePaths.length; i++) {
    const baselineY = padding + (ascent * scale) + (i * lineHeightPx);
    pathEls.push(`<path d="${linePaths[i]}" transform="translate(${padding}, ${baselineY})" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"/>`);
  }

  const bgRect = background
    ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(background)}"/>`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">` +
    `${bgRect}${pathEls.join("")}</svg>`
  );
}
