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
    getGlyphByChar: (ch: string) => any | null;
    getGlyph: (index: number) => any | null;
    getGlyphIndexByChar?: (ch: string) => number | null;
    getKerningValueByGlyphs?: (left: number, right: number) => number;
    getTableByType?: (tag: number) => any | null;
};

export class LayoutEngine {
    static layoutText(font: FontLike, text: string, options: LayoutOptions = {}): LayoutResult {
        const maxWidth = options.maxWidth ?? 0;
        const align = options.align ?? 'left';
        const letterSpacing = options.letterSpacing ?? 0;
        const useKerning = options.useKerning ?? true;
        const breakWords = options.breakWords ?? true;
        const trimLeadingSpaces = options.trimLeadingSpaces ?? true;
        const trimTrailingSpaces = options.trimTrailingSpaces ?? true;
        const collapseSpaces = options.collapseSpaces ?? false;
        const preserveNbsp = options.preserveNbsp ?? true;
        const tabSize = options.tabSize ?? 4;
        const justifyLastLine = options.justifyLastLine ?? false;
        const bidi = options.bidi ?? 'simple';
        const hyphenate = options.hyphenate ?? 'soft';
        const hyphenChar = options.hyphenChar ?? '-';
        const hyphenMinWordLength = options.hyphenMinWordLength ?? 6;
        const resolvedDirection = options.direction ?? 'ltr';
        const direction = resolvedDirection === 'auto'
            ? (this.hasRtl(text) ? 'rtl' : 'ltr')
            : resolvedDirection;

        const hhea = font.getTableByType?.(0x68686561); // hhea
        const head = font.getTableByType?.(0x68656164); // head
        const unitsPerEm = head?.unitsPerEm ?? 1000;
        const lineHeight = options.lineHeight ?? ((hhea?.ascender ?? unitsPerEm * 0.8) - (hhea?.descender ?? -unitsPerEm * 0.2) + (hhea?.lineGap ?? 0));
        const emitDiagnostic = (diagnostic: LayoutDiagnostic) => {
            options.diagnostics?.push(diagnostic);
            options.onDiagnostic?.(diagnostic);
        };

        const lines: LayoutLine[] = [];
        let current: LayoutGlyph[] = [];
        let cursorX = 0;

        const pushLine = (isLastLine: boolean) => {
            const width = this.measureLineWidth(current, trimTrailingSpaces);
            lines.push({ glyphs: current, width, isLastLine });
            current = [];
            cursorX = 0;
        };

        const tokens = this.tokenize(text, collapseSpaces, preserveNbsp, tabSize);
        for (const token of tokens) {
            if (token === '\n') {
                pushLine(false);
                continue;
            }

            if (trimLeadingSpaces && cursorX === 0 && /^\s+$/.test(token)) {
                continue;
            }

            if (hyphenate === 'soft' && maxWidth > 0 && breakWords && token.length >= hyphenMinWordLength && token.includes('\u00AD')) {
                const parts = token.split('\u00AD').filter(p => p.length > 0);
                const resolved = this.layoutSoftHyphenWord(font, parts, letterSpacing, useKerning, maxWidth, () => cursorX, glyphs => {
                    for (const glyph of glyphs) {
                        glyph.x = cursorX + glyph.x;
                        glyph.y = 0;
                        cursorX += glyph.advance;
                        current.push(glyph);
                    }
                }, () => {
                    pushLine(false);
                }, hyphenChar, emitDiagnostic);
                if (resolved) {
                    continue;
                }
            }

            const tokenGlyphs = this.buildTokenGlyphs(font, token.replace(/\u00AD/g, ''), letterSpacing, useKerning, emitDiagnostic);
            const tokenWidth = tokenGlyphs.reduce((sum, g) => sum + g.advance, 0);

            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
            }

            if (maxWidth > 0 && breakWords && tokenWidth > maxWidth) {
                for (const glyph of tokenGlyphs) {
                    if (maxWidth > 0 && cursorX > 0 && cursorX + glyph.advance > maxWidth) {
                        pushLine(false);
                    }
                    glyph.x = cursorX + glyph.x;
                    glyph.y = 0;
                    cursorX += glyph.advance;
                    current.push(glyph);
                }
                continue;
            }

            for (const glyph of tokenGlyphs) {
                glyph.x = cursorX + glyph.x;
                glyph.y = 0;
                cursorX += glyph.advance;
                current.push(glyph);
            }
        }

        pushLine(true);

        const resultWidth = maxWidth > 0 ? maxWidth : Math.max(0, ...lines.map(l => l.width));
        lines.forEach((line, index) => {
            const y = index * lineHeight;
            if (direction === 'rtl') {
                const reordered = bidi === 'simple'
                    ? this.reorderBidiRuns(line.glyphs)
                    : line.glyphs.slice().reverse();
                let cursor = 0;
                for (const g of reordered) {
                    g.x = cursor;
                    cursor += g.advance;
                }
                line.glyphs = reordered;
                line.width = cursor;
            }
            if (align === 'center') {
                const offset = (resultWidth - line.width) * 0.5;
                line.glyphs.forEach(g => (g.x += offset));
            } else if (align === 'right') {
                const offset = resultWidth - line.width;
                line.glyphs.forEach(g => (g.x += offset));
            } else if (align === 'justify' && maxWidth > 0 && (!line.isLastLine || justifyLastLine)) {
                this.justifyLine(line, resultWidth);
            }
            line.glyphs.forEach(g => (g.y = y));
        });

        return {
            lines,
            width: resultWidth,
            height: lines.length * lineHeight,
            lineHeight
        };
    }

    private static tokenize(text: string, collapseSpaces: boolean, preserveNbsp: boolean, tabSize: number): string[] {
        if (typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function') {
            const segments: string[] = [];
            const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'word' });
            const lines = text.split('\n');
            lines.forEach((line, index) => {
                const segs = Array.from(segmenter.segment(line));
                for (const seg of segs) {
                    const chunk = seg.segment as string;
                    if (chunk === '\t') {
                        const count = Math.max(1, tabSize);
                        if (collapseSpaces) {
                            if (!segments.length || segments[segments.length - 1] !== ' ') segments.push(' ');
                        } else {
                            for (let i = 0; i < count; i++) segments.push(' ');
                        }
                        continue;
                    }
                    if (preserveNbsp && chunk === '\u00A0') {
                        segments.push(chunk);
                        continue;
                    }
                    if (/^\s+$/.test(chunk)) {
                        if (collapseSpaces) {
                            if (!segments.length || segments[segments.length - 1] !== ' ') segments.push(' ');
                        } else {
                            segments.push(chunk);
                        }
                        continue;
                    }
                    segments.push(chunk);
                }
                if (index < lines.length - 1) segments.push('\n');
            });
            return segments;
        }
        const tokens: string[] = [];
        let buffer = '';
        let lastWasSpace = false;
        for (const ch of text) {
            if (ch === '\n') {
                if (buffer) tokens.push(buffer);
                tokens.push('\n');
                buffer = '';
                lastWasSpace = false;
                continue;
            }
            if (ch === '\t') {
                if (buffer) tokens.push(buffer);
                const count = Math.max(1, tabSize);
                if (collapseSpaces) {
                    if (!lastWasSpace) tokens.push(' ');
                    lastWasSpace = true;
                } else {
                    for (let i = 0; i < count; i++) tokens.push(' ');
                    lastWasSpace = true;
                }
                buffer = '';
                continue;
            }
            if (preserveNbsp && ch === '\u00A0') {
                buffer += ch;
                lastWasSpace = false;
                continue;
            }
            if (/\s/.test(ch)) {
                if (buffer) tokens.push(buffer);
                if (collapseSpaces) {
                    if (!lastWasSpace) tokens.push(' ');
                    lastWasSpace = true;
                } else {
                    tokens.push(ch);
                }
                buffer = '';
                continue;
            }
            buffer += ch;
            lastWasSpace = false;
        }
        if (buffer) tokens.push(buffer);
        return tokens;
    }

    private static buildTokenGlyphs(
        font: FontLike,
        token: string,
        letterSpacing: number,
        useKerning: boolean,
        emitDiagnostic?: (diagnostic: LayoutDiagnostic) => void
    ): LayoutGlyph[] {
        const glyphs: LayoutGlyph[] = [];
        let prevGlyph: number | null = null;
        for (const ch of token) {
            const glyphIndex = font.getGlyphIndexByChar ? font.getGlyphIndexByChar(ch) : null;
            const glyph = glyphIndex != null ? font.getGlyph(glyphIndex) : font.getGlyphByChar(ch);
            if (!glyph) {
                emitDiagnostic?.({
                    code: 'MISSING_GLYPH',
                    level: 'warning',
                    phase: 'layout',
                    message: 'Glyph missing for character during layout.',
                    context: { char: ch }
                });
                prevGlyph = null;
                continue;
            }
            const advance = glyph.advanceWidth + letterSpacing + (useKerning && prevGlyph != null && font.getKerningValueByGlyphs
                ? font.getKerningValueByGlyphs(prevGlyph, glyphIndex ?? 0)
                : 0);
            glyphs.push({ glyphIndex: glyphIndex ?? 0, x: 0, y: 0, advance, char: ch });
            prevGlyph = glyphIndex ?? 0;
        }
        return glyphs;
    }

    private static layoutSoftHyphenWord(
        font: FontLike,
        parts: string[],
        letterSpacing: number,
        useKerning: boolean,
        maxWidth: number,
        cursorGetter: () => number,
        pushGlyphs: (glyphs: LayoutGlyph[]) => void,
        pushLineBreak: () => void,
        hyphenChar: string,
        emitDiagnostic?: (diagnostic: LayoutDiagnostic) => void
    ): boolean {
        if (parts.length <= 1) return false;
        const hyphenGlyphs = this.buildTokenGlyphs(font, hyphenChar, letterSpacing, useKerning, emitDiagnostic);
        const hyphenWidth = hyphenGlyphs.reduce((sum, g) => sum + g.advance, 0);
        let remaining = parts.slice();
        let emitted = false;
        while (remaining.length > 0) {
            let consumed = 0;
            let width = 0;
            const glyphs: LayoutGlyph[] = [];
            while (consumed < remaining.length) {
                const next = remaining[consumed];
                const nextGlyphs = this.buildTokenGlyphs(font, next, letterSpacing, useKerning, emitDiagnostic);
                const nextWidth = nextGlyphs.reduce((sum, g) => sum + g.advance, 0);
                const fits = cursorGetter() + width + nextWidth + (consumed < remaining.length - 1 ? hyphenWidth : 0) <= maxWidth;
                if (!fits && consumed > 0) break;
                if (!fits) {
                    if (!emitted) {
                        emitDiagnostic?.({
                            code: 'SOFT_HYPHEN_FALLBACK',
                            level: 'warning',
                            phase: 'layout',
                            message: 'Soft-hyphen segmentation did not fit; falling back to character wrapping.',
                            context: { partCount: remaining.length, maxWidth }
                        });
                        return false;
                    }
                    const rest = this.buildTokenGlyphs(font, remaining.join(''), letterSpacing, useKerning, emitDiagnostic);
                    for (const restGlyph of rest) {
                        if (maxWidth > 0 && cursorGetter() > 0 && cursorGetter() + restGlyph.advance > maxWidth) {
                            pushLineBreak();
                        }
                        pushGlyphs([{ ...restGlyph }]);
                    }
                    return true;
                }
                glyphs.push(...nextGlyphs);
                width += nextWidth;
                consumed += 1;
            }

            if (consumed < remaining.length) {
                glyphs.push(...hyphenGlyphs.map(g => ({ ...g })));
            }
            pushGlyphs(glyphs);
            emitted = true;
            remaining = remaining.slice(consumed);
            if (remaining.length > 0) {
                pushLineBreak();
            }
        }
        return true;
    }

    private static justifyLine(line: LayoutLine, targetWidth: number): void {
        if (!line.glyphs.length) return;
        let lastIndex = line.glyphs.length - 1;
        while (lastIndex >= 0 && line.glyphs[lastIndex].char === ' ') lastIndex--;
        const spaces = line.glyphs.filter((g, idx) => g.char === ' ' && idx <= lastIndex);
        if (!spaces.length) return;
        const extra = targetWidth - line.width;
        if (extra <= 0) return;
        const add = extra / spaces.length;
        let offset = 0;
        for (let i = 0; i < line.glyphs.length; i++) {
            const glyph = line.glyphs[i];
            glyph.x += offset;
            if (glyph.char === ' ' && i <= lastIndex) {
                glyph.advance += add;
                offset += add;
            }
        }
        line.width = targetWidth;
    }

    private static measureLineWidth(glyphs: LayoutGlyph[], trimTrailingSpaces: boolean): number {
        if (!glyphs.length) return 0;
        let lastIndex = glyphs.length - 1;
        if (trimTrailingSpaces) {
            while (lastIndex >= 0 && glyphs[lastIndex].char === ' ') lastIndex--;
        }
        if (lastIndex < 0) return 0;
        let width = 0;
        for (let i = 0; i <= lastIndex; i++) {
            width += glyphs[i].advance;
        }
        return width;
    }

    private static hasRtl(text: string): boolean {
        return /[\u0590-\u08FF]/.test(text);
    }

    private static isRtlChar(ch: string): boolean {
        return /[\u0590-\u08FF]/.test(ch);
    }

    private static reorderBidiRuns(glyphs: LayoutGlyph[]): LayoutGlyph[] {
        const runs: LayoutGlyph[][] = [];
        let current: LayoutGlyph[] = [];
        let currentIsRtl: boolean | null = null;
        for (const glyph of glyphs) {
            const isRtl = glyph.char ? this.isRtlChar(glyph.char) : false;
            if (currentIsRtl === null) {
                currentIsRtl = isRtl;
                current.push(glyph);
                continue;
            }
            if (isRtl === currentIsRtl) {
                current.push(glyph);
                continue;
            }
            runs.push(current);
            current = [glyph];
            currentIsRtl = isRtl;
        }
        if (current.length) runs.push(current);
        return runs.reverse().flat();
    }
}
