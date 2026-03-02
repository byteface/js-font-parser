export function applyCanvasStyles(context, styles) {
    for (const [key, value] of Object.entries(styles)) {
        switch (key) {
            case 'color':
            case 'fill':
            case 'fillStyle':
                context.fillStyle = value;
                break;
            case 'stroke-color':
            case 'strokeStyle':
                context.strokeStyle = value;
                break;
            case 'opacity':
            case 'globalAlpha':
                context.globalAlpha = parseFloat(value);
                break;
            case 'line-width':
            case 'lineWidth':
                context.lineWidth = parseFloat(value);
                break;
            case 'shadow-color':
            case 'shadowColor':
                context.shadowColor = value;
                break;
            case 'shadow-blur':
            case 'shadowBlur':
                context.shadowBlur = parseFloat(value);
                break;
            case 'shadow-offset-x':
            case 'shadowOffsetX':
                context.shadowOffsetX = parseFloat(value);
                break;
            case 'shadow-offset-y':
            case 'shadowOffsetY':
                context.shadowOffsetY = parseFloat(value);
                break;
            default:
                break;
        }
    }
}

export function addContourToShape(context, glyph, startIndex, count) {
    if (glyph.getPoint(startIndex).endOfContour) {
        return;
    }

    let offset = 0;
    while (offset < count) {
        const p0 = glyph.getPoint(startIndex + offset % count);
        const p1 = glyph.getPoint(startIndex + (offset + 1) % count);

        if (offset === 0) {
            context.moveTo(p0.x, p0.y);
        }

        if (p0.onCurve) {
            if (p1.onCurve) {
                context.lineTo(p1.x, p1.y);
                offset++;
            } else {
                const p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                if (p2.onCurve) {
                    context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                } else {
                    context.quadraticCurveTo(p1.x, p1.y, midValue(p1.x, p2.x), midValue(p1.y, p2.y));
                }
                offset += 2;
            }
        } else {
            if (!p1.onCurve) {
                context.quadraticCurveTo(p0.x, p0.y, midValue(p0.x, p1.x), midValue(p0.y, p1.y));
            } else {
                context.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y);
            }
            offset++;
        }
    }
}

export function drawGlyphToContext(context, glyph, options) {
    if (!glyph) return;

    const scale = options.scale ?? 0.1;
    const x = options.x ?? 0;
    const y = options.y ?? 0;

    context.save();
    context.translate(x, y);
    context.scale(scale, -scale);

    if (options.styles) {
        applyCanvasStyles(context, options.styles);
    }

    context.beginPath();
    let firstindex = 0;
    let counter = 0;
    for (let i = 0; i < glyph.getPointCount(); i++) {
        counter++;
        if (glyph.getPoint(i).endOfContour) {
            addContourToShape(context, glyph, firstindex, counter);
            firstindex = i + 1;
            counter = 0;
        }
    }
    context.closePath();
    context.stroke();
    context.fill();
    context.restore();
}

export function drawString(font, text, canvas, options) {
    const scale = options.scale ?? 0.1;
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const spacing = options.spacing ?? 10;
    const context = canvas.getContext('2d');

    let cursorX = x;
    context.save();
    context.translate(0, y);

    for (const ch of text) {
        const glyph = font.getGlyphByChar(ch);
        if (!glyph) {
            cursorX += spacing;
            continue;
        }
        drawGlyphToContext(context, glyph, {
            x: cursorX / 1,
            y: 0,
            scale,
            styles: options.styles
        });
        cursorX += glyph.advanceWidth * scale + spacing;
    }

    context.restore();
}

export function drawStringWithKerning(font, text, canvas, options) {
    const scale = options.scale ?? 0.1;
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const spacing = options.spacing ?? 0;
    const context = canvas.getContext('2d');

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

        drawGlyphToContext(context, glyph, {
            x: cursorX / 1,
            y: 0,
            scale,
            styles: options.styles
        });

        cursorX += glyph.advanceWidth * scale + spacing + kern;
    }

    context.restore();
}

export function drawGlyphIndices(font, glyphIndices, canvas, options) {
    const scale = options.scale ?? 0.1;
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const spacing = options.spacing ?? 0;
    const context = canvas.getContext('2d');

    let cursorX = x;
    context.save();
    context.translate(0, y);

    for (const idx of glyphIndices) {
        const glyph = font.getGlyph(idx);
        if (!glyph) {
            cursorX += spacing;
            continue;
        }
        drawGlyphToContext(context, glyph, {
            x: cursorX / 1,
            y: 0,
            scale,
            styles: options.styles
        });
        cursorX += glyph.advanceWidth * scale + spacing;
    }

    context.restore();
}

export function drawLayout(font, layout, canvas, options) {
    const scale = options.scale ?? 0.1;
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const context = canvas.getContext('2d');

    let cursorX = x;
    context.save();
    context.translate(0, y);

    for (const item of layout) {
        const glyph = font.getGlyph(item.glyphIndex);
        if (!glyph) continue;
        drawGlyphToContext(context, glyph, {
            x: cursorX + (item.xOffset ?? 0) * scale,
            y: 0,
            scale,
            styles: options.styles
        });
        cursorX += (item.xAdvance ?? 0) * scale;
    }

    context.restore();
}

function midValue(a, b) {
    return (a + b) / 2;
}
