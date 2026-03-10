export type LayoutOptions = {
    maxWidth?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    direction?: 'ltr' | 'rtl' | 'auto';
    lineHeight?: number;
    letterSpacing?: number;
    useKerning?: boolean;
    breakWords?: boolean;
    trimLeadingSpaces?: boolean;
    trimTrailingSpaces?: boolean;
    collapseSpaces?: boolean;
    preserveNbsp?: boolean;
    tabSize?: number;
    justifyLastLine?: boolean;
    bidi?: 'none' | 'simple';
    hyphenate?: 'none' | 'soft';
    hyphenChar?: string;
    hyphenMinWordLength?: number;
    diagnostics?: LayoutDiagnostic[];
    onDiagnostic?: (diagnostic: LayoutDiagnostic) => void;
};
export type LayoutGlyph = {
    glyphIndex: number;
    x: number;
    y: number;
    advance: number;
    char?: string;
};
export type LayoutLine = {
    glyphs: LayoutGlyph[];
    width: number;
    isLastLine: boolean;
};
export type LayoutResult = {
    lines: LayoutLine[];
    width: number;
    height: number;
    lineHeight: number;
};
export type LayoutDiagnostic = {
    code: string;
    level: 'warning' | 'info';
    phase: 'layout';
    message: string;
    context?: Record<string, unknown>;
};
type FontLike = {
    getGlyphByChar: (ch: string) => {
        advanceWidth: number;
    } | null;
    getGlyph: (index: number) => {
        advanceWidth: number;
    } | null;
    getGlyphIndexByChar?: (ch: string) => number | null;
    getKerningValueByGlyphs?: (left: number, right: number) => number;
    getTableByType?: (tag: number) => {
        unitsPerEm?: number;
        ascender?: number;
        descender?: number;
        lineGap?: number;
    } | null;
};
export declare class LayoutEngine {
    /**
     * Generic text layout for wrapping/alignment.
     * Works on the parser surface (`getGlyphByChar`, kerning helpers) and
     * is intentionally independent from GSUB/GPOS internals.
     */
    static layoutText(font: FontLike, text: string, options?: LayoutOptions): LayoutResult;
    /**
     * Tokenize by words/whitespace/newlines with Segmenter when available.
     * Falls back to a deterministic character scanner otherwise.
     */
    private static tokenize;
    /**
     * Resolve characters to positioned glyph primitives with optional kerning.
     * Missing glyphs are skipped and emitted as layout diagnostics.
     */
    private static buildTokenGlyphs;
    private static layoutSoftHyphenWord;
    private static justifyLine;
    private static measureLineWidth;
    private static hasRtl;
    private static isRtlChar;
    private static reorderBidiRuns;
}
export {};
