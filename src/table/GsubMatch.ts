export type GsubMatchContext = { gdef?: any | null; lookupFlag?: number; markFilteringSet?: number | null };

export function isIgnoredGlyph(ctx: GsubMatchContext | undefined, glyphId: number): boolean {
    if (!ctx || !ctx.gdef) return false;
    const flag = ctx.lookupFlag ?? 0;
    if (!flag) return false;
    const glyphClass = ctx.gdef.getGlyphClass?.(glyphId) ?? 0;
    if ((flag & 0x0002) && glyphClass === 1) return true; // ignore base
    if ((flag & 0x0004) && glyphClass === 2) return true; // ignore ligatures
    if ((flag & 0x0008) && glyphClass === 3) return true; // ignore marks
    if ((flag & 0x0010) && glyphClass === 3) {
        const setIndex = ctx.markFilteringSet ?? 0;
        if (!ctx.gdef.isGlyphInMarkSet?.(setIndex, glyphId)) return true;
    }
    const markAttachType = (flag & 0xff00) >> 8;
    if (markAttachType && glyphClass === 3) {
        const cls = ctx.gdef.getMarkAttachmentClass?.(glyphId) ?? 0;
        if (cls !== markAttachType) return true;
    }
    return false;
}

export function matchInputSequence<T>(
    glyphs: number[],
    startIndex: number,
    expected: T[],
    matchFn: (expected: T, glyphId: number) => boolean,
    ctx?: GsubMatchContext
): number[] | null {
    const indices: number[] = [startIndex];
    let cursor = startIndex + 1;
    for (let i = 0; i < expected.length; i++) {
        while (cursor < glyphs.length && isIgnoredGlyph(ctx, glyphs[cursor])) cursor++;
        if (cursor >= glyphs.length) return null;
        if (!matchFn(expected[i], glyphs[cursor])) return null;
        indices.push(cursor);
        cursor++;
    }
    return indices;
}

export function matchBacktrackSequence<T>(
    glyphs: number[],
    startIndex: number,
    expected: T[],
    matchFn: (expected: T, glyphId: number) => boolean,
    ctx?: GsubMatchContext
): boolean {
    let cursor = startIndex - 1;
    for (let b = 0; b < expected.length; b++) {
        while (cursor >= 0 && isIgnoredGlyph(ctx, glyphs[cursor])) cursor--;
        if (cursor < 0) return false;
        const want = expected[expected.length - 1 - b];
        if (!matchFn(want, glyphs[cursor])) return false;
        cursor--;
    }
    return true;
}

export function matchLookaheadSequence<T>(
    glyphs: number[],
    startIndex: number,
    expected: T[],
    matchFn: (expected: T, glyphId: number) => boolean,
    ctx?: GsubMatchContext
): boolean {
    let cursor = startIndex + 1;
    for (let l = 0; l < expected.length; l++) {
        while (cursor < glyphs.length && isIgnoredGlyph(ctx, glyphs[cursor])) cursor++;
        if (cursor >= glyphs.length) return false;
        if (!matchFn(expected[l], glyphs[cursor])) return false;
        cursor++;
    }
    return true;
}
