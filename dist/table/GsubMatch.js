export function isIgnoredGlyph(ctx, glyphId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!ctx || !ctx.gdef)
        return false;
    var flag = (_a = ctx.lookupFlag) !== null && _a !== void 0 ? _a : 0;
    if (!flag)
        return false;
    var glyphClass = (_d = (_c = (_b = ctx.gdef).getGlyphClass) === null || _c === void 0 ? void 0 : _c.call(_b, glyphId)) !== null && _d !== void 0 ? _d : 0;
    if ((flag & 0x0002) && glyphClass === 1)
        return true; // ignore base
    if ((flag & 0x0004) && glyphClass === 2)
        return true; // ignore ligatures
    if ((flag & 0x0008) && glyphClass === 3)
        return true; // ignore marks
    if ((flag & 0x0010) && glyphClass === 3) {
        var setIndex = (_e = ctx.markFilteringSet) !== null && _e !== void 0 ? _e : 0;
        if (!((_g = (_f = ctx.gdef).isGlyphInMarkSet) === null || _g === void 0 ? void 0 : _g.call(_f, setIndex, glyphId)))
            return true;
    }
    var markAttachType = (flag & 0xff00) >> 8;
    if (markAttachType && glyphClass === 3) {
        var cls = (_k = (_j = (_h = ctx.gdef).getMarkAttachmentClass) === null || _j === void 0 ? void 0 : _j.call(_h, glyphId)) !== null && _k !== void 0 ? _k : 0;
        if (cls !== markAttachType)
            return true;
    }
    return false;
}
export function matchInputSequence(glyphs, startIndex, expected, matchFn, ctx) {
    var indices = [startIndex];
    var cursor = startIndex + 1;
    for (var i = 0; i < expected.length; i++) {
        while (cursor < glyphs.length && isIgnoredGlyph(ctx, glyphs[cursor]))
            cursor++;
        if (cursor >= glyphs.length)
            return null;
        if (!matchFn(expected[i], glyphs[cursor]))
            return null;
        indices.push(cursor);
        cursor++;
    }
    return indices;
}
export function matchBacktrackSequence(glyphs, startIndex, expected, matchFn, ctx) {
    var cursor = startIndex - 1;
    for (var b = 0; b < expected.length; b++) {
        while (cursor >= 0 && isIgnoredGlyph(ctx, glyphs[cursor]))
            cursor--;
        if (cursor < 0)
            return false;
        var want = expected[expected.length - 1 - b];
        if (!matchFn(want, glyphs[cursor]))
            return false;
        cursor--;
    }
    return true;
}
export function matchLookaheadSequence(glyphs, startIndex, expected, matchFn, ctx) {
    var cursor = startIndex + 1;
    for (var l = 0; l < expected.length; l++) {
        while (cursor < glyphs.length && isIgnoredGlyph(ctx, glyphs[cursor]))
            cursor++;
        if (cursor >= glyphs.length)
            return false;
        if (!matchFn(expected[l], glyphs[cursor]))
            return false;
        cursor++;
    }
    return true;
}
