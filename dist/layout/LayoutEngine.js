export class LayoutEngine {
    /**
     * Generic text layout for wrapping/alignment.
     * Works on the parser surface (`getGlyphByChar`, kerning helpers) and
     * is intentionally independent from GSUB/GPOS internals.
     */
    static layoutText(font, text, options = {}) {
        const maxWidth = Number.isFinite(options.maxWidth) ? options.maxWidth : 0;
        const align = options.align ?? 'left';
        const letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
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
        const emitDiagnostic = (diagnostic) => {
            options.diagnostics?.push(diagnostic);
            options.onDiagnostic?.(diagnostic);
        };
        let hhea = null;
        let head = null;
        if (typeof font.getTableByType === 'function') {
            try {
                hhea = font.getTableByType(0x68686561); // hhea
            }
            catch {
                emitDiagnostic({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'getTableByType callback threw while reading hhea.'
                });
            }
            try {
                head = font.getTableByType(0x68656164); // head
            }
            catch {
                emitDiagnostic({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'getTableByType callback threw while reading head.'
                });
            }
        }
        const unitsPerEm = Number.isFinite(head?.unitsPerEm) && head?.unitsPerEm > 0
            ? head?.unitsPerEm
            : 1000;
        const ascender = Number.isFinite(hhea?.ascender) ? hhea?.ascender : unitsPerEm * 0.8;
        const descender = Number.isFinite(hhea?.descender) ? hhea?.descender : -unitsPerEm * 0.2;
        const lineGap = Number.isFinite(hhea?.lineGap) ? hhea?.lineGap : 0;
        const fallbackLineHeight = unitsPerEm * 1.2;
        const rawComputedLineHeight = ascender - descender + lineGap;
        const computedLineHeight = Number.isFinite(rawComputedLineHeight) && rawComputedLineHeight > 0
            ? rawComputedLineHeight
            : fallbackLineHeight;
        const lineHeight = Number.isFinite(options.lineHeight) && options.lineHeight > 0
            ? options.lineHeight
            : computedLineHeight;
        const lines = [];
        let current = [];
        let cursorX = 0;
        const pushLine = (isLastLine) => {
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
        const resultWidth = maxWidth > 0 ? maxWidth : Math.max(0, ...lines.map(l => Number.isFinite(l.width) ? l.width : 0));
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
            }
            else if (align === 'right') {
                const offset = resultWidth - line.width;
                line.glyphs.forEach(g => (g.x += offset));
            }
            else if (align === 'justify' && maxWidth > 0 && (!line.isLastLine || justifyLastLine)) {
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
    /**
     * Tokenize by words/whitespace/newlines with Segmenter when available.
     * Falls back to a deterministic character scanner otherwise.
     */
    static tokenize(text, collapseSpaces, preserveNbsp, tabSize) {
        const normalizedText = text.replace(/\r\n?/g, '\n').replace(/[\u0085\u2028\u2029]/g, '\n');
        const segmenterCtor = Intl.Segmenter;
        if (typeof Intl !== 'undefined' && typeof segmenterCtor === 'function') {
            const segments = [];
            const segmenter = new segmenterCtor(undefined, { granularity: 'word' });
            const lines = normalizedText.split('\n');
            lines.forEach((line, index) => {
                const segs = Array.from(segmenter.segment(line));
                for (const seg of segs) {
                    const chunk = seg.segment;
                    if (chunk === '\t') {
                        const count = Math.max(1, tabSize);
                        if (collapseSpaces) {
                            if (!segments.length || segments[segments.length - 1] !== ' ')
                                segments.push(' ');
                        }
                        else {
                            for (let i = 0; i < count; i++)
                                segments.push(' ');
                        }
                        continue;
                    }
                    if (preserveNbsp && chunk === '\u00A0') {
                        segments.push(chunk);
                        continue;
                    }
                    if (/^\s+$/.test(chunk)) {
                        if (collapseSpaces) {
                            if (!segments.length || segments[segments.length - 1] !== ' ')
                                segments.push(' ');
                        }
                        else {
                            segments.push(chunk);
                        }
                        continue;
                    }
                    segments.push(chunk);
                }
                if (index < lines.length - 1)
                    segments.push('\n');
            });
            return segments;
        }
        const tokens = [];
        let buffer = '';
        let lastWasSpace = false;
        for (const ch of normalizedText) {
            if (ch === '\n') {
                if (buffer)
                    tokens.push(buffer);
                tokens.push('\n');
                buffer = '';
                lastWasSpace = false;
                continue;
            }
            if (ch === '\t') {
                if (buffer)
                    tokens.push(buffer);
                const count = Math.max(1, tabSize);
                if (collapseSpaces) {
                    if (!lastWasSpace)
                        tokens.push(' ');
                    lastWasSpace = true;
                }
                else {
                    for (let i = 0; i < count; i++)
                        tokens.push(' ');
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
                if (buffer)
                    tokens.push(buffer);
                if (collapseSpaces) {
                    if (!lastWasSpace)
                        tokens.push(' ');
                    lastWasSpace = true;
                }
                else {
                    tokens.push(ch);
                }
                buffer = '';
                continue;
            }
            buffer += ch;
            lastWasSpace = false;
        }
        if (buffer)
            tokens.push(buffer);
        return tokens;
    }
    /**
     * Resolve characters to positioned glyph primitives with optional kerning.
     * Missing glyphs are skipped and emitted as layout diagnostics.
     */
    static buildTokenGlyphs(font, token, letterSpacing, useKerning, emitDiagnostic) {
        const glyphs = [];
        let prevGlyph = null;
        for (const ch of token) {
            let glyphIndex = null;
            try {
                glyphIndex = font.getGlyphIndexByChar ? font.getGlyphIndexByChar(ch) : null;
            }
            catch {
                emitDiagnostic?.({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'getGlyphIndexByChar callback threw during layout.',
                    context: { char: ch }
                });
                glyphIndex = null;
            }
            let glyph = null;
            try {
                glyph = glyphIndex != null ? font.getGlyph(glyphIndex) : font.getGlyphByChar(ch);
            }
            catch {
                emitDiagnostic?.({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'Glyph fetch callback threw during layout.',
                    context: { char: ch, glyphIndex: glyphIndex ?? undefined }
                });
                glyph = null;
            }
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
            const baseAdvance = Number.isFinite(glyph.advanceWidth) ? glyph.advanceWidth : 0;
            let kern = 0;
            if (useKerning && prevGlyph != null && font.getKerningValueByGlyphs) {
                try {
                    kern = font.getKerningValueByGlyphs(prevGlyph, glyphIndex ?? 0);
                }
                catch {
                    emitDiagnostic?.({
                        code: 'LAYOUT_CALLBACK_ERROR',
                        level: 'warning',
                        phase: 'layout',
                        message: 'Kerning callback threw during layout.',
                        context: { char: ch, glyphIndex: glyphIndex ?? undefined }
                    });
                    kern = 0;
                }
            }
            const safeKern = Number.isFinite(kern) ? kern : 0;
            const advance = baseAdvance + letterSpacing + safeKern;
            glyphs.push({ glyphIndex: glyphIndex ?? 0, x: 0, y: 0, advance, char: ch });
            prevGlyph = glyphIndex ?? 0;
        }
        return glyphs;
    }
    static layoutSoftHyphenWord(font, parts, letterSpacing, useKerning, maxWidth, cursorGetter, pushGlyphs, pushLineBreak, hyphenChar, emitDiagnostic) {
        if (parts.length <= 1)
            return false;
        const hyphenGlyphs = this.buildTokenGlyphs(font, hyphenChar, letterSpacing, useKerning, emitDiagnostic);
        const hyphenWidth = hyphenGlyphs.reduce((sum, g) => sum + g.advance, 0);
        let remaining = parts.slice();
        let emitted = false;
        while (remaining.length > 0) {
            let consumed = 0;
            let width = 0;
            const glyphs = [];
            while (consumed < remaining.length) {
                const next = remaining[consumed];
                const nextGlyphs = this.buildTokenGlyphs(font, next, letterSpacing, useKerning, emitDiagnostic);
                const nextWidth = nextGlyphs.reduce((sum, g) => sum + g.advance, 0);
                const fits = cursorGetter() + width + nextWidth + (consumed < remaining.length - 1 ? hyphenWidth : 0) <= maxWidth;
                if (!fits && consumed > 0)
                    break;
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
    static justifyLine(line, targetWidth) {
        if (!line.glyphs.length)
            return;
        let lastIndex = line.glyphs.length - 1;
        while (lastIndex >= 0 && line.glyphs[lastIndex].char === ' ')
            lastIndex--;
        const spaces = line.glyphs.filter((g, idx) => g.char === ' ' && idx <= lastIndex);
        if (!spaces.length)
            return;
        const extra = targetWidth - line.width;
        if (extra <= 0)
            return;
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
    static measureLineWidth(glyphs, trimTrailingSpaces) {
        if (!glyphs.length)
            return 0;
        let lastIndex = glyphs.length - 1;
        if (trimTrailingSpaces) {
            while (lastIndex >= 0 && glyphs[lastIndex].char === ' ')
                lastIndex--;
        }
        if (lastIndex < 0)
            return 0;
        let width = 0;
        for (let i = 0; i <= lastIndex; i++) {
            width += glyphs[i].advance;
        }
        return width;
    }
    static hasRtl(text) {
        return /[\u0590-\u08FF]/.test(text);
    }
    static isRtlChar(ch) {
        return /[\u0590-\u08FF]/.test(ch);
    }
    static reorderBidiRuns(glyphs) {
        const runs = [];
        let current = [];
        let currentIsRtl = null;
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
        if (current.length)
            runs.push(current);
        return runs.reverse().flat();
    }
}
