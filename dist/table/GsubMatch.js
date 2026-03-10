export function isIgnoredGlyph(ctx, glyphId) {
    if (!ctx || !ctx.gdef)
        return false;
    const flag = ctx.lookupFlag ?? 0;
    if (!flag)
        return false;
    const glyphClass = ctx.gdef.getGlyphClass?.(glyphId) ?? 0;
    if ((flag & 0x0002) && glyphClass === 1)
        return true; // ignore base
    if ((flag & 0x0004) && glyphClass === 2)
        return true; // ignore ligatures
    if ((flag & 0x0008) && glyphClass === 3)
        return true; // ignore marks
    if ((flag & 0x0010) && glyphClass === 3) {
        const setIndex = ctx.markFilteringSet ?? 0;
        if (!ctx.gdef.isGlyphInMarkSet?.(setIndex, glyphId))
            return true;
    }
    const markAttachType = (flag & 0xff00) >> 8;
    if (markAttachType && glyphClass === 3) {
        const cls = ctx.gdef.getMarkAttachmentClass?.(glyphId) ?? 0;
        if (cls !== markAttachType)
            return true;
    }
    return false;
}
export function matchInputSequence(glyphs, startIndex, expected, matchFn, ctx) {
    const indices = [startIndex];
    let cursor = startIndex + 1;
    for (let i = 0; i < expected.length; i++) {
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
export function nextNonIgnoredIndex(glyphs, startIndex, ctx) {
    let i = startIndex;
    while (i < glyphs.length && isIgnoredGlyph(ctx, glyphs[i]))
        i++;
    return i;
}
export function prevNonIgnoredIndex(glyphs, startIndex, ctx) {
    let i = startIndex;
    while (i >= 0 && isIgnoredGlyph(ctx, glyphs[i]))
        i--;
    return i;
}
export function matchBacktrackSequence(glyphs, startIndex, expected, matchFn, ctx) {
    let cursor = startIndex - 1;
    for (let b = 0; b < expected.length; b++) {
        while (cursor >= 0 && isIgnoredGlyph(ctx, glyphs[cursor]))
            cursor--;
        if (cursor < 0)
            return false;
        const want = expected[expected.length - 1 - b];
        if (!matchFn(want, glyphs[cursor]))
            return false;
        cursor--;
    }
    return true;
}
export function matchLookaheadSequence(glyphs, startIndex, expected, matchFn, ctx) {
    let cursor = startIndex + 1;
    for (let l = 0; l < expected.length; l++) {
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
