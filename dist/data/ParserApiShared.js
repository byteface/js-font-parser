export function getGlyphPointsByChar(char, options, glyphResolver) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var getGlyphByChar = typeof glyphResolver === 'function'
        ? glyphResolver
        : ((_b = (_a = glyphResolver === null || glyphResolver === void 0 ? void 0 : glyphResolver.getGlyphByChar) === null || _a === void 0 ? void 0 : _a.bind(glyphResolver)) !== null && _b !== void 0 ? _b : null);
    if (!getGlyphByChar)
        return [];
    var glyph = null;
    try {
        glyph = getGlyphByChar(char);
    }
    catch (_e) {
        return [];
    }
    if (!glyph)
        return [];
    var rawStep = Number.isFinite(options.sampleStep) ? Number(options.sampleStep) : 1;
    var sampleStep = Math.max(1, Math.floor(rawStep));
    var points = [];
    var count = 0;
    try {
        count = Number.isFinite((_c = glyph.getPointCount) === null || _c === void 0 ? void 0 : _c.call(glyph)) ? glyph.getPointCount() : 0;
    }
    catch (_f) {
        return [];
    }
    for (var i = 0; i < count; i += sampleStep) {
        var p = null;
        try {
            p = (_d = glyph.getPoint) === null || _d === void 0 ? void 0 : _d.call(glyph, i);
        }
        catch (_g) {
            continue;
        }
        if (!p)
            continue;
        points.push({
            x: Number.isFinite(p.x) ? p.x : 0,
            y: Number.isFinite(p.y) ? p.y : 0,
            onCurve: !!p.onCurve,
            endOfContour: !!p.endOfContour
        });
    }
    return points;
}
export function measureText(text, options, layoutResolver) {
    var _a, _b, _c;
    if (options === void 0) { options = {}; }
    var layoutString = typeof layoutResolver === 'function'
        ? layoutResolver
        : ((_b = (_a = layoutResolver === null || layoutResolver === void 0 ? void 0 : layoutResolver.layoutString) === null || _a === void 0 ? void 0 : _a.bind(layoutResolver)) !== null && _b !== void 0 ? _b : null);
    if (!layoutString)
        return { advanceWidth: 0, glyphCount: 0 };
    var layout = null;
    try {
        layout = layoutString(text, options);
    }
    catch (_d) {
        return { advanceWidth: 0, glyphCount: 0 };
    }
    if (!Array.isArray(layout))
        return { advanceWidth: 0, glyphCount: 0 };
    var letterSpacing = Number.isFinite(options.letterSpacing) ? Number(options.letterSpacing) : 0;
    var advanceWidth = 0;
    for (var i = 0; i < layout.length; i++) {
        var xAdvance = Number.isFinite((_c = layout[i]) === null || _c === void 0 ? void 0 : _c.xAdvance) ? Number(layout[i].xAdvance) : 0;
        advanceWidth += xAdvance;
        if (letterSpacing !== 0 && i < layout.length - 1)
            advanceWidth += letterSpacing;
    }
    return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
}
export function layoutToPoints(text, options, api) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var out = { points: [], advanceWidth: 0, scale: 1 };
    if (!(api === null || api === void 0 ? void 0 : api.layoutString) || !api.getGlyph)
        return out;
    var layout = null;
    try {
        layout = api.layoutString(text, options);
    }
    catch (_e) {
        return out;
    }
    if (!Array.isArray(layout))
        return out;
    var rawStep = Number.isFinite(options.sampleStep) ? Number(options.sampleStep) : 1;
    var sampleStep = Math.max(1, Math.floor(rawStep));
    var unitsPerEm = 1000;
    try {
        var maybeUpem = (_a = api.getUnitsPerEm) === null || _a === void 0 ? void 0 : _a.call(api);
        unitsPerEm = Number.isFinite(maybeUpem) && Number(maybeUpem) > 0 ? Number(maybeUpem) : 1000;
    }
    catch (_f) {
        unitsPerEm = 1000;
    }
    var fontSize = Number.isFinite(options.fontSize) && Number(options.fontSize) > 0
        ? Number(options.fontSize)
        : unitsPerEm;
    var scale = fontSize / unitsPerEm;
    var originX = Number.isFinite(options.x) ? Number(options.x) : 0;
    var originY = Number.isFinite(options.y) ? Number(options.y) : 0;
    var letterSpacing = Number.isFinite(options.letterSpacing) ? Number(options.letterSpacing) : 0;
    out.scale = Number.isFinite(scale) ? scale : 1;
    var penX = 0;
    for (var i = 0; i < layout.length; i++) {
        var item = (_b = layout[i]) !== null && _b !== void 0 ? _b : { glyphIndex: 0, xAdvance: 0, xOffset: 0, yOffset: 0 };
        var glyph = null;
        try {
            glyph = api.getGlyph(item.glyphIndex);
        }
        catch (_g) {
            glyph = null;
        }
        if (glyph) {
            var count = 0;
            try {
                count = Number.isFinite((_c = glyph.getPointCount) === null || _c === void 0 ? void 0 : _c.call(glyph)) ? glyph.getPointCount() : 0;
            }
            catch (_h) {
                count = 0;
            }
            for (var pIndex = 0; pIndex < count; pIndex += sampleStep) {
                var p = null;
                try {
                    p = (_d = glyph.getPoint) === null || _d === void 0 ? void 0 : _d.call(glyph, pIndex);
                }
                catch (_j) {
                    p = null;
                }
                if (!p)
                    continue;
                out.points.push({
                    x: originX + (penX + (Number.isFinite(item.xOffset) ? Number(item.xOffset) : 0) + (Number.isFinite(p.x) ? p.x : 0)) * out.scale,
                    y: originY - ((Number.isFinite(item.yOffset) ? Number(item.yOffset) : 0) + (Number.isFinite(p.y) ? p.y : 0)) * out.scale,
                    onCurve: !!p.onCurve,
                    endOfContour: !!p.endOfContour,
                    glyphIndex: item.glyphIndex,
                    pointIndex: pIndex
                });
            }
        }
        penX += Number.isFinite(item.xAdvance) ? Number(item.xAdvance) : 0;
        if (letterSpacing !== 0 && i < layout.length - 1)
            penX += letterSpacing;
    }
    out.advanceWidth = Number.isFinite(penX) ? penX : 0;
    return out;
}
export function getColorLayersForGlyph(glyphId, paletteIndex, api) {
    var _a, _b;
    if (paletteIndex === void 0) { paletteIndex = 0; }
    if (!(api === null || api === void 0 ? void 0 : api.hasColr) || typeof api.getLayersForGlyph !== 'function')
        return [];
    var layers = null;
    try {
        layers = api.getLayersForGlyph(glyphId);
    }
    catch (_c) {
        return [];
    }
    if (!Array.isArray(layers) || layers.length === 0)
        return [];
    var palette = null;
    try {
        palette = (_b = (_a = api.getPalette) === null || _a === void 0 ? void 0 : _a.call(api, paletteIndex)) !== null && _b !== void 0 ? _b : null;
    }
    catch (_d) {
        palette = null;
    }
    return layers.map(function (layer) {
        if (layer.paletteIndex === 0xffff) {
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        }
        var color = palette === null || palette === void 0 ? void 0 : palette[layer.paletteIndex];
        if (!color)
            return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
        return {
            glyphId: layer.glyphId,
            color: "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat(color.alpha / 255, ")"),
            paletteIndex: layer.paletteIndex
        };
    });
}
export function getColorLayersForChar(char, paletteIndex, api) {
    if (paletteIndex === void 0) { paletteIndex = 0; }
    if (!(api === null || api === void 0 ? void 0 : api.getGlyphIndexByChar) || !api.getColorLayersForGlyph)
        return [];
    var glyphId = null;
    try {
        glyphId = api.getGlyphIndexByChar(char);
    }
    catch (_a) {
        return [];
    }
    if (glyphId == null)
        return [];
    try {
        var out = api.getColorLayersForGlyph(glyphId, paletteIndex);
        return Array.isArray(out) ? out : [];
    }
    catch (_b) {
        return [];
    }
}
export function computeVariationCoords(axes, values) {
    var _a;
    var coords = [];
    for (var _i = 0, _b = axes !== null && axes !== void 0 ? axes : []; _i < _b.length; _i++) {
        var axis = _b[_i];
        var value = (_a = values === null || values === void 0 ? void 0 : values[axis.name]) !== null && _a !== void 0 ? _a : axis.defaultValue;
        var norm = 0;
        if (value !== axis.defaultValue) {
            if (value > axis.defaultValue) {
                var span = axis.maxValue - axis.defaultValue;
                norm = Number.isFinite(span) && span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
            else {
                var span = axis.defaultValue - axis.minValue;
                norm = Number.isFinite(span) && span !== 0 ? (value - axis.defaultValue) / span : 0;
            }
        }
        coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
    }
    return coords;
}
