var CanvasRenderer = /** @class */ (function () {
    function CanvasRenderer() {
    }
    CanvasRenderer.applyCanvasStyles = function (context, styles) {
        if (!styles)
            return;
        if (styles.fillStyle != null)
            context.fillStyle = styles.fillStyle;
        if (styles.strokeStyle != null)
            context.strokeStyle = styles.strokeStyle;
        if (styles.globalAlpha != null)
            context.globalAlpha = styles.globalAlpha;
        if (styles.lineWidth != null)
            context.lineWidth = styles.lineWidth;
        if (styles.shadowColor != null)
            context.shadowColor = styles.shadowColor;
        if (styles.shadowBlur != null)
            context.shadowBlur = styles.shadowBlur;
        if (styles.shadowOffsetX != null)
            context.shadowOffsetX = styles.shadowOffsetX;
        if (styles.shadowOffsetY != null)
            context.shadowOffsetY = styles.shadowOffsetY;
    };
    CanvasRenderer.addContourToShape = function (context, glyph, startIndex, count) {
        var _a;
        if ((_a = glyph.getPoint(startIndex)) === null || _a === void 0 ? void 0 : _a.endOfContour)
            return;
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + offset % count);
            var p1 = glyph.getPoint(startIndex + (offset + 1) % count);
            if (!p0 || !p1)
                break;
            if (offset === 0) {
                context.moveTo(p0.x, p0.y);
            }
            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo(p1.x, p1.y);
                    offset++;
                }
                else {
                    var p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (!p2)
                        break;
                    if (p2.onCurve) {
                        context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    }
                    else {
                        context.quadraticCurveTo(p1.x, p1.y, this.midValue(p1.x, p2.x), this.midValue(p1.y, p2.y));
                    }
                    offset += 2;
                }
            }
            else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(p0.x, p0.y, this.midValue(p0.x, p1.x), this.midValue(p0.y, p1.y));
                }
                else {
                    context.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y);
                }
                offset++;
            }
        }
    };
    CanvasRenderer.addContourToShapeCubic = function (context, glyph, startIndex, count) {
        var _a;
        if ((_a = glyph.getPoint(startIndex)) === null || _a === void 0 ? void 0 : _a.endOfContour)
            return;
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + (offset % count));
            var p1 = glyph.getPoint(startIndex + ((offset + 1) % count));
            if (!p0 || !p1)
                break;
            if (offset === 0) {
                context.moveTo(p0.x, p0.y);
            }
            if (p1.onCurve) {
                context.lineTo(p1.x, p1.y);
                offset += 1;
                continue;
            }
            var p2 = glyph.getPoint(startIndex + ((offset + 2) % count));
            var p3 = glyph.getPoint(startIndex + ((offset + 3) % count));
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
    };
    CanvasRenderer.drawGlyphToContext = function (context, glyph, options) {
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        if (!glyph)
            return;
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        context.save();
        context.translate(x, y);
        context.scale(scale, -scale);
        this.applyCanvasStyles(context, options.styles);
        context.beginPath();
        var firstIndex = 0;
        var counter = 0;
        for (var i = 0; i < glyph.getPointCount(); i++) {
            counter++;
            if ((_d = glyph.getPoint(i)) === null || _d === void 0 ? void 0 : _d.endOfContour) {
                if (glyph.isCubic) {
                    this.addContourToShapeCubic(context, glyph, firstIndex, counter);
                }
                else {
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
        }
        else if (glyph.isCubic) {
            context.fill("evenodd");
        }
        else {
            context.fill();
        }
        context.restore();
    };
    CanvasRenderer.drawString = function (font, text, canvas, options) {
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var spacing = (_d = options.spacing) !== null && _d !== void 0 ? _d : 0;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            var glyph = font.getGlyphByChar(ch);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale: scale,
                styles: options.styles
            });
            cursorX += glyph.advanceWidth * scale + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawStringWithKerning = function (font, text, canvas, options) {
        var _a, _b, _c, _d, _e;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var spacing = (_d = options.spacing) !== null && _d !== void 0 ? _d : 0;
        var kerningScale = (_e = options.kerningScale) !== null && _e !== void 0 ? _e : 1;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            var glyph = font.getGlyphByChar(ch);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }
            var kern = 0;
            if (i < text.length - 1 && typeof font.getKerningValue === 'function') {
                kern = font.getKerningValue(ch, text[i + 1]) * scale * kerningScale;
            }
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale: scale,
                styles: options.styles
            });
            cursorX += glyph.advanceWidth * scale + spacing + kern;
        }
        context.restore();
    };
    CanvasRenderer.drawGlyphIndices = function (font, glyphIndices, canvas, options) {
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var spacing = (_d = options.spacing) !== null && _d !== void 0 ? _d : 0;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, glyphIndices_1 = glyphIndices; _i < glyphIndices_1.length; _i++) {
            var idx = glyphIndices_1[_i];
            var glyph = font.getGlyph(idx);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale: scale,
                styles: options.styles
            });
            cursorX += glyph.advanceWidth * scale + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawColorGlyph = function (font, glyphIndex, canvas, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var layers = typeof font.getColorLayersForGlyph === 'function'
            ? font.getColorLayersForGlyph(glyphIndex, (_d = options.paletteIndex) !== null && _d !== void 0 ? _d : 0)
            : [];
        if ((!layers || layers.length === 0) && typeof font.getColrV1LayersForGlyph === 'function') {
            layers = font.getColrV1LayersForGlyph(glyphIndex, (_e = options.paletteIndex) !== null && _e !== void 0 ? _e : 0);
        }
        if (!layers || layers.length === 0) {
            var glyph = font.getGlyph(glyphIndex);
            if (!glyph)
                return;
            this.drawGlyphToContext(context, glyph, { x: x, y: y, scale: scale, styles: options.styles });
            return;
        }
        for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
            var layer = layers_1[_i];
            var glyph = font.getGlyph(layer.glyphId);
            if (!glyph)
                continue;
            var fill = (_j = (_g = (_f = layer.color) !== null && _f !== void 0 ? _f : options.fallbackFill) !== null && _g !== void 0 ? _g : (_h = options.styles) === null || _h === void 0 ? void 0 : _h.fillStyle) !== null && _j !== void 0 ? _j : '#111';
            this.drawGlyphToContext(context, glyph, {
                x: x,
                y: y,
                scale: scale,
                styles: {
                    fillStyle: fill,
                    strokeStyle: 'rgba(0,0,0,0)',
                    lineWidth: 0
                }
            });
        }
    };
    CanvasRenderer.drawColorString = function (font, text, canvas, options) {
        var _a, _b, _c, _d, _e, _f;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var spacing = (_d = options.spacing) !== null && _d !== void 0 ? _d : 0;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, _g = Array.from(text); _i < _g.length; _i++) {
            var ch = _g[_i];
            var glyphIndex = typeof font.getGlyphIndexByChar === 'function'
                ? font.getGlyphIndexByChar(ch)
                : null;
            if (glyphIndex == null) {
                cursorX += spacing;
                continue;
            }
            this.drawColorGlyph(font, glyphIndex, canvas, {
                x: cursorX,
                y: 0,
                scale: scale,
                paletteIndex: options.paletteIndex,
                fallbackFill: options.fallbackFill,
                styles: options.styles
            });
            var glyph = font.getGlyph(glyphIndex);
            var advance = (_e = glyph === null || glyph === void 0 ? void 0 : glyph.advanceWidth) !== null && _e !== void 0 ? _e : 0;
            var fallbackAdvance = (_f = options.fallbackAdvance) !== null && _f !== void 0 ? _f : 0;
            cursorX += (advance > 0 ? advance : fallbackAdvance) * scale + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawLayout = function (font, layout, canvas, options) {
        var _a, _b, _c, _d, _e, _f;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 0.1;
        var x = (_b = options.x) !== null && _b !== void 0 ? _b : 0;
        var y = (_c = options.y) !== null && _c !== void 0 ? _c : 0;
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, layout_1 = layout; _i < layout_1.length; _i++) {
            var item = layout_1[_i];
            var glyph = font.getGlyph(item.glyphIndex);
            if (!glyph)
                continue;
            this.drawGlyphToContext(context, glyph, {
                x: cursorX + ((_d = item.xOffset) !== null && _d !== void 0 ? _d : 0) * scale,
                y: ((_e = item.yOffset) !== null && _e !== void 0 ? _e : 0) * scale,
                scale: scale,
                styles: options.styles
            });
            cursorX += ((_f = item.xAdvance) !== null && _f !== void 0 ? _f : 0) * scale;
        }
        context.restore();
    };
    CanvasRenderer.midValue = function (a, b) {
        return (a + b) / 2;
    };
    return CanvasRenderer;
}());
export { CanvasRenderer };
