export function getGlyphPointsByChar(char, options, getGlyphByChar) {
    var _a;
    var glyph = getGlyphByChar(char);
    if (!glyph)
        return [];
    var sampleStep = Math.max(1, Math.floor((_a = options === null || options === void 0 ? void 0 : options.sampleStep) !== null && _a !== void 0 ? _a : 1));
    var points = [];
    for (var i = 0; i < glyph.getPointCount(); i += sampleStep) {
        var p = glyph.getPoint(i);
        if (!p)
            continue;
        points.push({
            x: p.x,
            y: p.y,
            onCurve: p.onCurve,
            endOfContour: p.endOfContour
        });
    }
    return points;
}
export function measureText(text, options, layoutString) {
    var _a;
    var layout = layoutString(text, options !== null && options !== void 0 ? options : {});
    var letterSpacing = (_a = options === null || options === void 0 ? void 0 : options.letterSpacing) !== null && _a !== void 0 ? _a : 0;
    var advanceWidth = 0;
    for (var i = 0; i < layout.length; i++) {
        advanceWidth += layout[i].xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1)
            advanceWidth += letterSpacing;
    }
    return { advanceWidth: advanceWidth, glyphCount: layout.length };
}
export function layoutToPoints(text, options, deps) {
    var _a, _b, _c, _d, _e;
    var safeOptions = options !== null && options !== void 0 ? options : {};
    var layout = deps.layoutString(text, safeOptions);
    var sampleStep = Math.max(1, Math.floor((_a = safeOptions.sampleStep) !== null && _a !== void 0 ? _a : 1));
    var unitsPerEm = deps.getUnitsPerEm();
    var fontSize = (_b = safeOptions.fontSize) !== null && _b !== void 0 ? _b : unitsPerEm;
    var scale = fontSize / unitsPerEm;
    var originX = (_c = safeOptions.x) !== null && _c !== void 0 ? _c : 0;
    var originY = (_d = safeOptions.y) !== null && _d !== void 0 ? _d : 0;
    var letterSpacing = (_e = safeOptions.letterSpacing) !== null && _e !== void 0 ? _e : 0;
    var points = [];
    var penX = 0;
    for (var i = 0; i < layout.length; i++) {
        var item = layout[i];
        var glyph = deps.getGlyph(item.glyphIndex);
        if (glyph) {
            for (var pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                var p = glyph.getPoint(pIndex);
                if (!p)
                    continue;
                points.push({
                    x: originX + (penX + item.xOffset + p.x) * scale,
                    y: originY - (item.yOffset + p.y) * scale,
                    onCurve: p.onCurve,
                    endOfContour: p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += item.xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1)
            penX += letterSpacing;
    }
    return { points: points, advanceWidth: penX, scale: scale };
}
export function getColorLayersForGlyph(glyphId, paletteIndex, deps) {
    if (!deps.hasColr)
        return [];
    var layers = deps.getLayersForGlyph(glyphId);
    if (layers.length === 0)
        return [];
    var palette = deps.getPalette(paletteIndex);
    return layers.map(function (layer) {
        if (layer.paletteIndex === 0xffff) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        var color = palette[layer.paletteIndex];
        if (!color) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        var rgba = "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat(color.alpha / 255, ")");
        return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
    });
}
export function getColorLayersForChar(char, paletteIndex, deps) {
    var glyphId = deps.getGlyphIndexByChar(char);
    if (glyphId == null)
        return [];
    return deps.getColorLayersForGlyph(glyphId, paletteIndex);
}
export function computeVariationCoords(axes, values) {
    var _a;
    var coords = [];
    for (var _i = 0, axes_1 = axes; _i < axes_1.length; _i++) {
        var axis = axes_1[_i];
        var value = (_a = values[axis.name]) !== null && _a !== void 0 ? _a : axis.defaultValue;
        var norm = 0;
        if (value !== axis.defaultValue) {
            if (value > axis.defaultValue) {
                var span = axis.maxValue - axis.defaultValue;
                norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
            else {
                var span = axis.defaultValue - axis.minValue;
                norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
        }
        coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
    }
    return coords;
}
