var CanvasRenderer = /** @class */ (function () {
    function CanvasRenderer() {
    }
    CanvasRenderer.safeNumber = function (value, fallback) {
        return Number.isFinite(value) ? value : fallback;
    };
    CanvasRenderer.safeProduct = function (a, b, fallback) {
        if (fallback === void 0) { fallback = 0; }
        var product = a * b;
        return Number.isFinite(product) ? product : fallback;
    };
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
        var _a;
        if (options === void 0) { options = {}; }
        if (!glyph)
            return;
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        context.save();
        context.translate(x, y);
        context.scale(scale, -scale);
        this.applyCanvasStyles(context, options.styles);
        context.beginPath();
        var firstIndex = 0;
        var counter = 0;
        for (var i = 0; i < glyph.getPointCount(); i++) {
            counter++;
            if ((_a = glyph.getPoint(i)) === null || _a === void 0 ? void 0 : _a.endOfContour) {
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
        else {
            // CFF/CFF2 outlines use nonzero winding by default
            context.fill();
        }
        context.restore();
    };
    CanvasRenderer.drawString = function (font, text, canvas, options) {
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        var spacing = this.safeNumber(options.spacing, 0);
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, _a = Array.from(text); _i < _a.length; _i++) {
            var ch = _a[_i];
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
            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawStringWithKerning = function (font, text, canvas, options) {
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        var spacing = this.safeNumber(options.spacing, 0);
        var kerningScale = this.safeNumber(options.kerningScale, 1);
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var chars = Array.from(text);
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            var glyph = font.getGlyphByChar(ch);
            if (!glyph) {
                cursorX += spacing;
                continue;
            }
            var kern = 0;
            if (i < chars.length - 1 && typeof font.getKerningValue === 'function') {
                try {
                    var rawKern = font.getKerningValue(ch, chars[i + 1]);
                    kern = this.safeProduct(this.safeProduct(rawKern, scale), kerningScale);
                }
                catch (_a) {
                    kern = 0;
                }
            }
            this.drawGlyphToContext(context, glyph, {
                x: cursorX,
                y: 0,
                scale: scale,
                styles: options.styles
            });
            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing + kern;
        }
        context.restore();
    };
    CanvasRenderer.drawGlyphIndices = function (font, glyphIndices, canvas, options) {
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        var spacing = this.safeNumber(options.spacing, 0);
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
            cursorX += this.safeProduct(glyph.advanceWidth, scale) + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawColorGlyph = function (font, glyphIndex, canvas, options) {
        var _a, _b, _c, _d, _e, _f;
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var paletteIndex = this.safeNumber(options.paletteIndex, 0);
        var layers = [];
        if (typeof font.getColorLayersForGlyph === 'function') {
            try {
                layers = (_a = font.getColorLayersForGlyph(glyphIndex, paletteIndex)) !== null && _a !== void 0 ? _a : [];
            }
            catch (_g) {
                layers = [];
            }
        }
        if ((!layers || layers.length === 0) && typeof font.getColrV1LayersForGlyph === 'function') {
            try {
                layers = (_b = font.getColrV1LayersForGlyph(glyphIndex, paletteIndex)) !== null && _b !== void 0 ? _b : [];
            }
            catch (_h) {
                layers = [];
            }
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
            var fill = (_f = (_d = (_c = layer.color) !== null && _c !== void 0 ? _c : options.fallbackFill) !== null && _d !== void 0 ? _d : (_e = options.styles) === null || _e === void 0 ? void 0 : _e.fillStyle) !== null && _f !== void 0 ? _f : '#111';
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
        var _a;
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
        var spacing = this.safeNumber(options.spacing, 0);
        var paletteIndex = this.safeNumber(options.paletteIndex, 0);
        var fallbackAdvance = this.safeNumber(options.fallbackAdvance, 0);
        var context = canvas.getContext('2d');
        if (!context)
            return;
        var cursorX = x;
        context.save();
        context.translate(0, y);
        for (var _i = 0, _b = Array.from(text); _i < _b.length; _i++) {
            var ch = _b[_i];
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
                paletteIndex: paletteIndex,
                fallbackFill: options.fallbackFill,
                styles: options.styles
            });
            var glyph = font.getGlyph(glyphIndex);
            var advance = (_a = glyph === null || glyph === void 0 ? void 0 : glyph.advanceWidth) !== null && _a !== void 0 ? _a : 0;
            var effectiveAdvance = advance > 0 ? advance : fallbackAdvance;
            cursorX += this.safeProduct(effectiveAdvance, scale) + spacing;
        }
        context.restore();
    };
    CanvasRenderer.drawLayout = function (font, layout, canvas, options) {
        if (options === void 0) { options = {}; }
        var scale = this.safeNumber(options.scale, 0.1);
        var x = this.safeNumber(options.x, 0);
        var y = this.safeNumber(options.y, 0);
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
            var xOffset = this.safeNumber(item.xOffset, 0);
            var yOffset = this.safeNumber(item.yOffset, 0);
            var xAdvance = this.safeNumber(item.xAdvance, 0);
            this.drawGlyphToContext(context, glyph, {
                x: cursorX + this.safeProduct(xOffset, scale),
                y: this.safeProduct(yOffset, scale),
                scale: scale,
                styles: options.styles
            });
            cursorX += this.safeProduct(xAdvance, scale);
        }
        context.restore();
    };
    CanvasRenderer.midValue = function (a, b) {
        return (a + b) / 2;
    };
    return CanvasRenderer;
}());
export { CanvasRenderer };
