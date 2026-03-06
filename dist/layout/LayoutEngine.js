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
    LayoutEngine.layoutText = function (font, text, options) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        if (options === void 0) { options = {}; }
        var maxWidth = (_a = options.maxWidth) !== null && _a !== void 0 ? _a : 0;
        var align = (_b = options.align) !== null && _b !== void 0 ? _b : 'left';
        var letterSpacing = (_c = options.letterSpacing) !== null && _c !== void 0 ? _c : 0;
        var useKerning = (_d = options.useKerning) !== null && _d !== void 0 ? _d : true;
        var breakWords = (_e = options.breakWords) !== null && _e !== void 0 ? _e : true;
        var trimLeadingSpaces = (_f = options.trimLeadingSpaces) !== null && _f !== void 0 ? _f : true;
        var trimTrailingSpaces = (_g = options.trimTrailingSpaces) !== null && _g !== void 0 ? _g : true;
        var collapseSpaces = (_h = options.collapseSpaces) !== null && _h !== void 0 ? _h : false;
        var preserveNbsp = (_j = options.preserveNbsp) !== null && _j !== void 0 ? _j : true;
        var tabSize = (_k = options.tabSize) !== null && _k !== void 0 ? _k : 4;
        var justifyLastLine = (_l = options.justifyLastLine) !== null && _l !== void 0 ? _l : false;
        var bidi = (_m = options.bidi) !== null && _m !== void 0 ? _m : 'simple';
        var hyphenate = (_o = options.hyphenate) !== null && _o !== void 0 ? _o : 'soft';
        var hyphenChar = (_p = options.hyphenChar) !== null && _p !== void 0 ? _p : '-';
        var hyphenMinWordLength = (_q = options.hyphenMinWordLength) !== null && _q !== void 0 ? _q : 6;
        var resolvedDirection = (_r = options.direction) !== null && _r !== void 0 ? _r : 'ltr';
        var direction = resolvedDirection === 'auto'
            ? (this.hasRtl(text) ? 'rtl' : 'ltr')
            : resolvedDirection;
        var hhea = (_s = font.getTableByType) === null || _s === void 0 ? void 0 : _s.call(font, 0x68686561); // hhea
        var head = (_t = font.getTableByType) === null || _t === void 0 ? void 0 : _t.call(font, 0x68656164); // head
        var unitsPerEm = (_u = head === null || head === void 0 ? void 0 : head.unitsPerEm) !== null && _u !== void 0 ? _u : 1000;
        var lineHeight = (_v = options.lineHeight) !== null && _v !== void 0 ? _v : (((_w = hhea === null || hhea === void 0 ? void 0 : hhea.ascender) !== null && _w !== void 0 ? _w : unitsPerEm * 0.8) - ((_x = hhea === null || hhea === void 0 ? void 0 : hhea.descender) !== null && _x !== void 0 ? _x : -unitsPerEm * 0.2) + ((_y = hhea === null || hhea === void 0 ? void 0 : hhea.lineGap) !== null && _y !== void 0 ? _y : 0));
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
            if (hyphenate === 'soft' && maxWidth > 0 && breakWords && token.length >= hyphenMinWordLength && token.indexOf('\u00AD') !== -1) {
                var parts = token.split('\u00AD').filter(function (p) { return p.length > 0; });
                var resolved = this.layoutSoftHyphenWord(font, parts, letterSpacing, useKerning, maxWidth, function () { return cursorX; }, function (glyphs) {
                    for (var _i = 0, glyphs_1 = glyphs; _i < glyphs_1.length; _i++) {
                        var glyph = glyphs_1[_i];
                        glyph.x = cursorX + glyph.x;
                        glyph.y = 0;
                        cursorX += glyph.advance;
                        current.push(glyph);
                    }
                }, hyphenChar);
                if (resolved) {
                    continue;
                }
            }
            var tokenGlyphs = this.buildTokenGlyphs(font, token.replace(/\u00AD/g, ''), letterSpacing, useKerning);
            var tokenWidth = tokenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
            }
            if (maxWidth > 0 && breakWords && tokenWidth > maxWidth) {
                for (var _v = 0, tokenGlyphs_1 = tokenGlyphs; _v < tokenGlyphs_1.length; _v++) {
                    var glyph = tokenGlyphs_1[_v];
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
            for (var _w = 0, tokenGlyphs_2 = tokenGlyphs; _w < tokenGlyphs_2.length; _w++) {
                var glyph = tokenGlyphs_2[_w];
                glyph.x = cursorX + glyph.x;
                glyph.y = 0;
                cursorX += glyph.advance;
                current.push(glyph);
            }
        }
        pushLine(true);
        var resultWidth = maxWidth > 0 ? maxWidth : Math.max.apply(Math, __spreadArray([0], lines.map(function (l) { return l.width; }), false));
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
    LayoutEngine.tokenize = function (text, collapseSpaces, preserveNbsp, tabSize) {
        if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
            var segments = [];
            var segmenter_1 = new Intl.Segmenter(undefined, { granularity: 'word' });
            var lines_1 = text.split('\n');
            lines_1.forEach(function (line, index) {
                var _a;
                var segs = Array.from(segmenter_1.segment(line));
                for (var _i = 0, segs_1 = segs; _i < segs_1.length; _i++) {
                    var seg = segs_1[_i];
                    var chunk = seg.segment;
                    if (chunk === '\t') {
                        var count = Math.max(1, tabSize);
                        if (collapseSpaces) {
                            if (!segments.length || segments[segments.length - 1] !== ' ')
                                segments.push(' ');
                        }
                        else {
                            for (var i = 0; i < count; i++)
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
                if (index < lines_1.length - 1)
                    segments.push('\n');
                _a = segments;
                return _a;
            });
            return segments;
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
    LayoutEngine.buildTokenGlyphs = function (font, token, letterSpacing, useKerning) {
        var glyphs = [];
        var prevGlyph = null;
        for (var _i = 0, token_1 = token; _i < token_1.length; _i++) {
            var ch = token_1[_i];
            var glyphIndex = font.getGlyphIndexByChar ? font.getGlyphIndexByChar(ch) : null;
            var glyph = glyphIndex != null ? font.getGlyph(glyphIndex) : font.getGlyphByChar(ch);
            if (!glyph) {
                prevGlyph = null;
                continue;
            }
            var advance = glyph.advanceWidth + letterSpacing + (useKerning && prevGlyph != null && font.getKerningValueByGlyphs
                ? font.getKerningValueByGlyphs(prevGlyph, glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0)
                : 0);
            glyphs.push({ glyphIndex: glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0, x: 0, y: 0, advance: advance, char: ch });
            prevGlyph = glyphIndex !== null && glyphIndex !== void 0 ? glyphIndex : 0;
        }
        return glyphs;
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
        for (var _i = 0, _a = line.glyphs; _i < _a.length; _i++) {
            var glyph = _a[_i];
            glyph.x += offset;
            if (glyph.char === ' ') {
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
    LayoutEngine.layoutSoftHyphenWord = function (font, parts, letterSpacing, useKerning, maxWidth, cursorGetter, pushGlyphs, hyphenChar) {
        if (parts.length <= 1)
            return false;
        var hyphenGlyphs = this.buildTokenGlyphs(font, hyphenChar, letterSpacing, useKerning);
        var hyphenWidth = hyphenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
        var remaining = parts.slice();
        while (remaining.length > 0) {
            var consumed = 0;
            var width = 0;
            var glyphs = [];
            while (consumed < remaining.length) {
                var next = remaining[consumed];
                var nextGlyphs = this.buildTokenGlyphs(font, next, letterSpacing, useKerning);
                var nextWidth = nextGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
                var fits = cursorGetter() + width + nextWidth + (consumed < remaining.length - 1 ? hyphenWidth : 0) <= maxWidth;
                if (!fits && consumed > 0)
                    break;
                if (!fits)
                    return false;
                glyphs.push.apply(glyphs, nextGlyphs);
                width += nextWidth;
                consumed += 1;
            }
            if (consumed < remaining.length) {
                glyphs.push.apply(glyphs, hyphenGlyphs.map(function (g) { return ({ glyphIndex: g.glyphIndex, x: g.x, y: g.y, advance: g.advance, char: g.char }); }));
            }
            pushGlyphs(glyphs);
            remaining = remaining.slice(consumed);
            if (remaining.length > 0) {
                return true;
            }
        }
        return true;
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
        for (var _i = 0, glyphs_3 = glyphs; _i < glyphs_3.length; _i++) {
            var glyph = glyphs_3[_i];
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
