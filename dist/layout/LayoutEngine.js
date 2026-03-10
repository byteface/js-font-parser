var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var LayoutEngine = /** @class */ (function () {
    function LayoutEngine() {
    }
    /**
     * Generic text layout for wrapping/alignment.
     * Works on the parser surface (`getGlyphByChar`, kerning helpers) and
     * is intentionally independent from GSUB/GPOS internals.
     */
    LayoutEngine.layoutText = function (font, text, options) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        if (options === void 0) { options = {}; }
        var maxWidth = Number.isFinite(options.maxWidth) ? options.maxWidth : 0;
        var align = (_a = options.align) !== null && _a !== void 0 ? _a : 'left';
        var letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
        var useKerning = (_b = options.useKerning) !== null && _b !== void 0 ? _b : true;
        var breakWords = (_c = options.breakWords) !== null && _c !== void 0 ? _c : true;
        var trimLeadingSpaces = (_d = options.trimLeadingSpaces) !== null && _d !== void 0 ? _d : true;
        var trimTrailingSpaces = (_e = options.trimTrailingSpaces) !== null && _e !== void 0 ? _e : true;
        var collapseSpaces = (_f = options.collapseSpaces) !== null && _f !== void 0 ? _f : false;
        var preserveNbsp = (_g = options.preserveNbsp) !== null && _g !== void 0 ? _g : true;
        var tabSize = (_h = options.tabSize) !== null && _h !== void 0 ? _h : 4;
        var justifyLastLine = (_j = options.justifyLastLine) !== null && _j !== void 0 ? _j : false;
        var bidi = (_k = options.bidi) !== null && _k !== void 0 ? _k : 'simple';
        var hyphenate = (_l = options.hyphenate) !== null && _l !== void 0 ? _l : 'soft';
        var hyphenChar = (_m = options.hyphenChar) !== null && _m !== void 0 ? _m : '-';
        var hyphenMinWordLength = (_o = options.hyphenMinWordLength) !== null && _o !== void 0 ? _o : 6;
        var resolvedDirection = (_p = options.direction) !== null && _p !== void 0 ? _p : 'ltr';
        var direction = resolvedDirection === 'auto'
            ? (this.hasRtl(text) ? 'rtl' : 'ltr')
            : resolvedDirection;
        var emitDiagnostic = function (diagnostic) {
            var _a, _b;
            (_a = options.diagnostics) === null || _a === void 0 ? void 0 : _a.push(diagnostic);
            (_b = options.onDiagnostic) === null || _b === void 0 ? void 0 : _b.call(options, diagnostic);
        };
        var hhea = null;
        var head = null;
        if (typeof font.getTableByType === 'function') {
            try {
                hhea = font.getTableByType(0x68686561); // hhea
            }
            catch (_q) {
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
            catch (_r) {
                emitDiagnostic({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'getTableByType callback threw while reading head.'
                });
            }
        }
        var unitsPerEm = Number.isFinite(head === null || head === void 0 ? void 0 : head.unitsPerEm) && (head === null || head === void 0 ? void 0 : head.unitsPerEm) > 0
            ? head === null || head === void 0 ? void 0 : head.unitsPerEm
            : 1000;
        var ascender = Number.isFinite(hhea === null || hhea === void 0 ? void 0 : hhea.ascender) ? hhea === null || hhea === void 0 ? void 0 : hhea.ascender : unitsPerEm * 0.8;
        var descender = Number.isFinite(hhea === null || hhea === void 0 ? void 0 : hhea.descender) ? hhea === null || hhea === void 0 ? void 0 : hhea.descender : -unitsPerEm * 0.2;
        var lineGap = Number.isFinite(hhea === null || hhea === void 0 ? void 0 : hhea.lineGap) ? hhea === null || hhea === void 0 ? void 0 : hhea.lineGap : 0;
        var fallbackLineHeight = unitsPerEm * 1.2;
        var rawComputedLineHeight = ascender - descender + lineGap;
        var computedLineHeight = Number.isFinite(rawComputedLineHeight) && rawComputedLineHeight > 0
            ? rawComputedLineHeight
            : fallbackLineHeight;
        var lineHeight = Number.isFinite(options.lineHeight) && options.lineHeight > 0
            ? options.lineHeight
            : computedLineHeight;
        var lines = [];
        var current = [];
        var cursorX = 0;
        var pushLine = function (isLastLine) {
            var width = _this.measureLineWidth(current, trimTrailingSpaces);
            lines.push({ glyphs: current, width: width, isLastLine: isLastLine });
            current = [];
            cursorX = 0;
        };
        var tokens = this.tokenize(text, collapseSpaces, preserveNbsp, tabSize);
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token === '\n') {
                pushLine(false);
                continue;
            }
            if (trimLeadingSpaces && cursorX === 0 && /^\s+$/.test(token)) {
                continue;
            }
            if (hyphenate === 'soft' && maxWidth > 0 && breakWords && token.length >= hyphenMinWordLength && token.includes('\u00AD')) {
                var parts = token.split('\u00AD').filter(function (p) { return p.length > 0; });
                var resolved = this.layoutSoftHyphenWord(font, parts, letterSpacing, useKerning, maxWidth, function () { return cursorX; }, function (glyphs) {
                    for (var _i = 0, glyphs_1 = glyphs; _i < glyphs_1.length; _i++) {
                        var glyph = glyphs_1[_i];
                        glyph.x = cursorX + glyph.x;
                        glyph.y = 0;
                        cursorX += glyph.advance;
                        current.push(glyph);
                    }
                }, function () {
                    pushLine(false);
                }, hyphenChar, emitDiagnostic);
                if (resolved) {
                    continue;
                }
            }
            var tokenGlyphs = this.buildTokenGlyphs(font, token.replace(/\u00AD/g, ''), letterSpacing, useKerning, emitDiagnostic);
            var tokenWidth = tokenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
            }
            if (maxWidth > 0 && breakWords && tokenWidth > maxWidth) {
                for (var _s = 0, tokenGlyphs_1 = tokenGlyphs; _s < tokenGlyphs_1.length; _s++) {
                    var glyph = tokenGlyphs_1[_s];
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
            for (var _t = 0, tokenGlyphs_2 = tokenGlyphs; _t < tokenGlyphs_2.length; _t++) {
                var glyph = tokenGlyphs_2[_t];
                glyph.x = cursorX + glyph.x;
                glyph.y = 0;
                cursorX += glyph.advance;
                current.push(glyph);
            }
        }
        pushLine(true);
        var resultWidth = maxWidth > 0 ? maxWidth : Math.max.apply(Math, __spreadArray([0], lines.map(function (l) { return Number.isFinite(l.width) ? l.width : 0; }), false));
        lines.forEach(function (line, index) {
            var y = index * lineHeight;
            if (direction === 'rtl') {
                var reordered = bidi === 'simple'
                    ? _this.reorderBidiRuns(line.glyphs)
                    : line.glyphs.slice().reverse();
                var cursor = 0;
                for (var _i = 0, reordered_1 = reordered; _i < reordered_1.length; _i++) {
                    var g = reordered_1[_i];
                    g.x = cursor;
                    cursor += g.advance;
                }
                line.glyphs = reordered;
                line.width = cursor;
            }
            if (align === 'center') {
                var offset_1 = (resultWidth - line.width) * 0.5;
                line.glyphs.forEach(function (g) { return (g.x += offset_1); });
            }
            else if (align === 'right') {
                var offset_2 = resultWidth - line.width;
                line.glyphs.forEach(function (g) { return (g.x += offset_2); });
            }
            else if (align === 'justify' && maxWidth > 0 && (!line.isLastLine || justifyLastLine)) {
                _this.justifyLine(line, resultWidth);
            }
            line.glyphs.forEach(function (g) { return (g.y = y); });
        });
        return {
            lines: lines,
            width: resultWidth,
            height: lines.length * lineHeight,
            lineHeight: lineHeight
        };
    };
    /**
     * Tokenize by words/whitespace/newlines with Segmenter when available.
     * Falls back to a deterministic character scanner otherwise.
     */
    LayoutEngine.tokenize = function (text, collapseSpaces, preserveNbsp, tabSize) {
        var segmenterCtor = Intl.Segmenter;
        if (typeof Intl !== 'undefined' && typeof segmenterCtor === 'function') {
            var segments_1 = [];
            var segmenter_1 = new segmenterCtor(undefined, { granularity: 'word' });
            var lines_1 = text.split('\n');
            lines_1.forEach(function (line, index) {
                var segs = Array.from(segmenter_1.segment(line));
                for (var _i = 0, _a = segs; _i < _a.length; _i++) {
                    var seg = _a[_i];
                    var chunk = seg.segment;
                    if (chunk === '\t') {
                        var count = Math.max(1, tabSize);
                        if (collapseSpaces) {
                            if (!segments_1.length || segments_1[segments_1.length - 1] !== ' ')
                                segments_1.push(' ');
                        }
                        else {
                            for (var i = 0; i < count; i++)
                                segments_1.push(' ');
                        }
                        continue;
                    }
                    if (preserveNbsp && chunk === '\u00A0') {
                        segments_1.push(chunk);
                        continue;
                    }
                    if (/^\s+$/.test(chunk)) {
                        if (collapseSpaces) {
                            if (!segments_1.length || segments_1[segments_1.length - 1] !== ' ')
                                segments_1.push(' ');
                        }
                        else {
                            segments_1.push(chunk);
                        }
                        continue;
                    }
                    segments_1.push(chunk);
                }
                if (index < lines_1.length - 1)
                    segments_1.push('\n');
            });
            return segments_1;
        }
        var tokens = [];
        var buffer = '';
        var lastWasSpace = false;
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
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
                var count = Math.max(1, tabSize);
                if (collapseSpaces) {
                    if (!lastWasSpace)
                        tokens.push(' ');
                    lastWasSpace = true;
                }
                else {
                    for (var i = 0; i < count; i++)
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
    };
    /**
     * Resolve characters to positioned glyph primitives with optional kerning.
     * Missing glyphs are skipped and emitted as layout diagnostics.
     */
    LayoutEngine.buildTokenGlyphs = function (font, token, letterSpacing, useKerning, emitDiagnostic) {
        var glyphs = [];
        var prevGlyph = null;
        for (var _i = 0, token_1 = token; _i < token_1.length; _i++) {
            var ch = token_1[_i];
            var glyphIndex = null;
            try {
                glyphIndex = font.getGlyphIndexByChar ? font.getGlyphIndexByChar(ch) : null;
            }
            catch (_a) {
                emitDiagnostic === null || emitDiagnostic === void 0 ? void 0 : emitDiagnostic({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'getGlyphIndexByChar callback threw during layout.',
                    context: { char: ch }
                });
                glyphIndex = null;
            }
            var glyph = null;
            try {
                glyph = glyphIndex != null ? font.getGlyph(glyphIndex) : font.getGlyphByChar(ch);
            }
            catch (_b) {
                emitDiagnostic === null || emitDiagnostic === void 0 ? void 0 : emitDiagnostic({
                    code: 'LAYOUT_CALLBACK_ERROR',
                    level: 'warning',
                    phase: 'layout',
                    message: 'Glyph fetch callback threw during layout.',
                    context: { char: ch, glyphIndex: glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : undefined }
                });
                glyph = null;
            }
            if (!glyph) {
                emitDiagnostic === null || emitDiagnostic === void 0 ? void 0 : emitDiagnostic({
                    code: 'MISSING_GLYPH',
                    level: 'warning',
                    phase: 'layout',
                    message: 'Glyph missing for character during layout.',
                    context: { char: ch }
                });
                prevGlyph = null;
                continue;
            }
            var baseAdvance = Number.isFinite(glyph.advanceWidth) ? glyph.advanceWidth : 0;
            var kern = 0;
            if (useKerning && prevGlyph != null && font.getKerningValueByGlyphs) {
                try {
                    kern = font.getKerningValueByGlyphs(prevGlyph, glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0);
                }
                catch (_c) {
                    emitDiagnostic === null || emitDiagnostic === void 0 ? void 0 : emitDiagnostic({
                        code: 'LAYOUT_CALLBACK_ERROR',
                        level: 'warning',
                        phase: 'layout',
                        message: 'Kerning callback threw during layout.',
                        context: { char: ch, glyphIndex: glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : undefined }
                    });
                    kern = 0;
                }
            }
            var safeKern = Number.isFinite(kern) ? kern : 0;
            var advance = baseAdvance + letterSpacing + safeKern;
            glyphs.push({ glyphIndex: glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0, x: 0, y: 0, advance: advance, char: ch });
            prevGlyph = glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0;
        }
        return glyphs;
    };
    LayoutEngine.layoutSoftHyphenWord = function (font, parts, letterSpacing, useKerning, maxWidth, cursorGetter, pushGlyphs, pushLineBreak, hyphenChar, emitDiagnostic) {
        if (parts.length <= 1)
            return false;
        var hyphenGlyphs = this.buildTokenGlyphs(font, hyphenChar, letterSpacing, useKerning, emitDiagnostic);
        var hyphenWidth = hyphenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
        var remaining = parts.slice();
        var emitted = false;
        while (remaining.length > 0) {
            var consumed = 0;
            var width = 0;
            var glyphs = [];
            while (consumed < remaining.length) {
                var next = remaining[consumed];
                var nextGlyphs = this.buildTokenGlyphs(font, next, letterSpacing, useKerning, emitDiagnostic);
                var nextWidth = nextGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
                var fits = cursorGetter() + width + nextWidth + (consumed < remaining.length - 1 ? hyphenWidth : 0) <= maxWidth;
                if (!fits && consumed > 0)
                    break;
                if (!fits) {
                    if (!emitted) {
                        emitDiagnostic === null || emitDiagnostic === void 0 ? void 0 : emitDiagnostic({
                            code: 'SOFT_HYPHEN_FALLBACK',
                            level: 'warning',
                            phase: 'layout',
                            message: 'Soft-hyphen segmentation did not fit; falling back to character wrapping.',
                            context: { partCount: remaining.length, maxWidth: maxWidth }
                        });
                        return false;
                    }
                    var rest = this.buildTokenGlyphs(font, remaining.join(''), letterSpacing, useKerning, emitDiagnostic);
                    for (var _i = 0, rest_1 = rest; _i < rest_1.length; _i++) {
                        var restGlyph = rest_1[_i];
                        if (maxWidth > 0 && cursorGetter() > 0 && cursorGetter() + restGlyph.advance > maxWidth) {
                            pushLineBreak();
                        }
                        pushGlyphs([__assign({}, restGlyph)]);
                    }
                    return true;
                }
                glyphs.push.apply(glyphs, nextGlyphs);
                width += nextWidth;
                consumed += 1;
            }
            if (consumed < remaining.length) {
                glyphs.push.apply(glyphs, hyphenGlyphs.map(function (g) { return (__assign({}, g)); }));
            }
            pushGlyphs(glyphs);
            emitted = true;
            remaining = remaining.slice(consumed);
            if (remaining.length > 0) {
                pushLineBreak();
            }
        }
        return true;
    };
    LayoutEngine.justifyLine = function (line, targetWidth) {
        if (!line.glyphs.length)
            return;
        var lastIndex = line.glyphs.length - 1;
        while (lastIndex >= 0 && line.glyphs[lastIndex].char === ' ')
            lastIndex--;
        var spaces = line.glyphs.filter(function (g, idx) { return g.char === ' ' && idx <= lastIndex; });
        if (!spaces.length)
            return;
        var extra = targetWidth - line.width;
        if (extra <= 0)
            return;
        var add = extra / spaces.length;
        var offset = 0;
        for (var i = 0; i < line.glyphs.length; i++) {
            var glyph = line.glyphs[i];
            glyph.x += offset;
            if (glyph.char === ' ' && i <= lastIndex) {
                glyph.advance += add;
                offset += add;
            }
        }
        line.width = targetWidth;
    };
    LayoutEngine.measureLineWidth = function (glyphs, trimTrailingSpaces) {
        if (!glyphs.length)
            return 0;
        var lastIndex = glyphs.length - 1;
        if (trimTrailingSpaces) {
            while (lastIndex >= 0 && glyphs[lastIndex].char === ' ')
                lastIndex--;
        }
        if (lastIndex < 0)
            return 0;
        var width = 0;
        for (var i = 0; i <= lastIndex; i++) {
            width += glyphs[i].advance;
        }
        return width;
    };
    LayoutEngine.hasRtl = function (text) {
        return /[\u0590-\u08FF]/.test(text);
    };
    LayoutEngine.isRtlChar = function (ch) {
        return /[\u0590-\u08FF]/.test(ch);
    };
    LayoutEngine.reorderBidiRuns = function (glyphs) {
        var runs = [];
        var current = [];
        var currentIsRtl = null;
        for (var _i = 0, glyphs_2 = glyphs; _i < glyphs_2.length; _i++) {
            var glyph = glyphs_2[_i];
            var isRtl = glyph.char ? this.isRtlChar(glyph.char) : false;
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
    };
    return LayoutEngine;
}());
export { LayoutEngine };
