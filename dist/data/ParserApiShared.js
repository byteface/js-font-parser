export function getGlyphPointsByChar(char, options, getGlyphByChar) {
    var glyph = getGlyphByChar(char);
    if (!glyph)
        return [];
    var sampleBase = Number.isFinite(options === null || options === void 0 ? void 0 : options.sampleStep) ? options.sampleStep : 1;
    var sampleStep = Math.max(1, Math.floor(sampleBase));
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
    var layout = [];
    try {
        var resolved = layoutString(text, options !== null && options !== void 0 ? options : {});
        layout = Array.isArray(resolved) ? resolved : [];
    }
    catch (_a) {
        layout = [];
    }
    var letterSpacing = Number.isFinite(options === null || options === void 0 ? void 0 : options.letterSpacing) ? options.letterSpacing : 0;
    var advanceWidth = 0;
    for (var i = 0; i < layout.length; i++) {
        var xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
        advanceWidth += xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1)
            advanceWidth += letterSpacing;
    }
    return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
}
export function layoutToPoints(text, options, deps) {
    var safeOptions = options !== null && options !== void 0 ? options : {};
    var layout = [];
    try {
        var resolved = deps.layoutString(text, safeOptions);
        layout = Array.isArray(resolved) ? resolved : [];
    }
    catch (_a) {
        layout = [];
    }
    var sampleBase = Number.isFinite(safeOptions.sampleStep) ? safeOptions.sampleStep : 1;
    var sampleStep = Math.max(1, Math.floor(sampleBase));
    var unitsPerEmRaw = 1000;
    try {
        unitsPerEmRaw = deps.getUnitsPerEm();
    }
    catch (_b) {
        unitsPerEmRaw = 1000;
    }
    var unitsPerEm = Number.isFinite(unitsPerEmRaw) && unitsPerEmRaw > 0 ? unitsPerEmRaw : 1000;
    var fontSize = Number.isFinite(safeOptions.fontSize) && safeOptions.fontSize > 0
        ? safeOptions.fontSize
        : unitsPerEm;
    var scale = fontSize / unitsPerEm;
    var originX = Number.isFinite(safeOptions.x) ? safeOptions.x : 0;
    var originY = Number.isFinite(safeOptions.y) ? safeOptions.y : 0;
    var letterSpacing = Number.isFinite(safeOptions.letterSpacing) ? safeOptions.letterSpacing : 0;
    var points = [];
    var penX = 0;
    for (var i = 0; i < layout.length; i++) {
        var item = layout[i];
        var glyph = null;
        try {
            glyph = deps.getGlyph(item.glyphIndex);
        }
        catch (_c) {
            glyph = null;
        }
        if (glyph) {
            var pointCount = 0;
            try {
                pointCount = glyph.getPointCount();
            }
            catch (_d) {
                pointCount = 0;
            }
            for (var pIndex = 0; pIndex < pointCount; pIndex += sampleStep) {
                var p = null;
                try {
                    p = glyph.getPoint(pIndex);
                }
                catch (_e) {
                    p = null;
                }
                if (!p)
                    continue;
                points.push({
                    x: originX + (penX + (Number.isFinite(item.xOffset) ? item.xOffset : 0) + p.x) * scale,
                    y: originY - ((Number.isFinite(item.yOffset) ? item.yOffset : 0) + p.y) * scale,
                    onCurve: p.onCurve,
                    endOfContour: p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += Number.isFinite(item.xAdvance) ? item.xAdvance : 0;
        if (letterSpacing !== 0 && i < layout.length - 1)
            penX += letterSpacing;
    }
    return {
        points: points,
        advanceWidth: Number.isFinite(penX) ? penX : 0,
        scale: Number.isFinite(scale) ? scale : 1
    };
}
export function getColorLayersForGlyph(glyphId, paletteIndex, deps) {
    if (!deps.hasColr)
        return [];
    var layers = [];
    try {
        var resolved = deps.getLayersForGlyph(glyphId);
        layers = Array.isArray(resolved) ? resolved : [];
    }
    catch (_a) {
        layers = [];
    }
    if (layers.length === 0)
        return [];
    var paletteRaw = [];
    try {
        paletteRaw = deps.getPalette(paletteIndex);
    }
    catch (_b) {
        paletteRaw = [];
    }
    var palette = Array.isArray(paletteRaw) ? paletteRaw : [];
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
    var glyphId = null;
    try {
        glyphId = deps.getGlyphIndexByChar(char);
    }
    catch (_a) {
        glyphId = null;
    }
    if (glyphId == null)
        return [];
    try {
        var layers = deps.getColorLayersForGlyph(glyphId, paletteIndex);
        return Array.isArray(layers) ? layers : [];
    }
    catch (_b) {
        return [];
    }
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
