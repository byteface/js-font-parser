export type LayoutOptions = {
    maxWidth?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
    useKerning?: boolean;
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

        const hhea = font.getTableByType?.(0x68686561); // hhea
        const head = font.getTableByType?.(0x68656164); // head
        const unitsPerEm = head?.unitsPerEm ?? 1000;
        const lineHeight = options.lineHeight ?? ((hhea?.ascender ?? unitsPerEm * 0.8) - (hhea?.descender ?? -unitsPerEm * 0.2) + (hhea?.lineGap ?? 0));

        const lines: LayoutLine[] = [];
        let current: LayoutGlyph[] = [];
        let cursorX = 0;

        const pushLine = (isLastLine: boolean) => {
            const width = cursorX;
            lines.push({ glyphs: current, width, isLastLine });
            current = [];
            cursorX = 0;
        };

        const tokens = this.tokenize(text);
        for (const token of tokens) {
            if (token === '\n') {
                pushLine(false);
                continue;
            }

            const tokenGlyphs = this.buildTokenGlyphs(font, token, letterSpacing, useKerning);
            const tokenWidth = tokenGlyphs.reduce((sum, g) => sum + g.advance, 0);

            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
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
            if (align === 'center') {
                const offset = (resultWidth - line.width) * 0.5;
                line.glyphs.forEach(g => (g.x += offset));
            } else if (align === 'right') {
                const offset = resultWidth - line.width;
                line.glyphs.forEach(g => (g.x += offset));
            } else if (align === 'justify' && !line.isLastLine && maxWidth > 0) {
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

    private static tokenize(text: string): string[] {
        const tokens: string[] = [];
        let buffer = '';
        for (const ch of text) {
            if (ch === '\n') {
                if (buffer) tokens.push(buffer);
                tokens.push('\n');
                buffer = '';
                continue;
            }
            if (/\s/.test(ch)) {
                if (buffer) tokens.push(buffer);
                tokens.push(ch);
                buffer = '';
                continue;
            }
            buffer += ch;
        }
        if (buffer) tokens.push(buffer);
        return tokens;
    }

    private static buildTokenGlyphs(font: FontLike, token: string, letterSpacing: number, useKerning: boolean): LayoutGlyph[] {
        const glyphs: LayoutGlyph[] = [];
        let prevGlyph: number | null = null;
        for (const ch of token) {
            const glyphIndex = font.getGlyphIndexByChar ? font.getGlyphIndexByChar(ch) : null;
            const glyph = glyphIndex != null ? font.getGlyph(glyphIndex) : font.getGlyphByChar(ch);
            if (!glyph) {
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

    private static justifyLine(line: LayoutLine, targetWidth: number): void {
        if (!line.glyphs.length) return;
        const spaces = line.glyphs.filter(g => g.char === ' ');
        if (!spaces.length) return;
        const extra = targetWidth - line.width;
        if (extra <= 0) return;
        const add = extra / spaces.length;
        let offset = 0;
        for (const glyph of line.glyphs) {
            glyph.x += offset;
            if (glyph.char === ' ') {
                glyph.advance += add;
                offset += add;
            }
        }
        line.width = targetWidth;
    }
}
