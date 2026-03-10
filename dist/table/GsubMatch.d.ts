export type GsubMatchContext = {
    gdef?: any | null;
    lookupFlag?: number;
    markFilteringSet?: number | null;
};
export declare function isIgnoredGlyph(ctx: GsubMatchContext | undefined, glyphId: number): boolean;
export declare function matchInputSequence<T>(glyphs: number[], startIndex: number, expected: T[], matchFn: (expected: T, glyphId: number) => boolean, ctx?: GsubMatchContext): number[] | null;
export declare function nextNonIgnoredIndex(glyphs: number[], startIndex: number, ctx?: GsubMatchContext): number;
export declare function prevNonIgnoredIndex(glyphs: number[], startIndex: number, ctx?: GsubMatchContext): number;
export declare function matchBacktrackSequence<T>(glyphs: number[], startIndex: number, expected: T[], matchFn: (expected: T, glyphId: number) => boolean, ctx?: GsubMatchContext): boolean;
export declare function matchLookaheadSequence<T>(glyphs: number[], startIndex: number, expected: T[], matchFn: (expected: T, glyphId: number) => boolean, ctx?: GsubMatchContext): boolean;
