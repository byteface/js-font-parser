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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
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
        var hhea = (_m = font.getTableByType) === null || _m === void 0 ? void 0 : _m.call(font, 0x68686561); // hhea
        var head = (_o = font.getTableByType) === null || _o === void 0 ? void 0 : _o.call(font, 0x68656164); // head
        var unitsPerEm = (_p = head === null || head === void 0 ? void 0 : head.unitsPerEm) !== null && _p !== void 0 ? _p : 1000;
        var lineHeight = (_q = options.lineHeight) !== null && _q !== void 0 ? _q : (((_r = hhea === null || hhea === void 0 ? void 0 : hhea.ascender) !== null && _r !== void 0 ? _r : unitsPerEm * 0.8) - ((_s = hhea === null || hhea === void 0 ? void 0 : hhea.descender) !== null && _s !== void 0 ? _s : -unitsPerEm * 0.2) + ((_t = hhea === null || hhea === void 0 ? void 0 : hhea.lineGap) !== null && _t !== void 0 ? _t : 0));
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
            var tokenGlyphs = this.buildTokenGlyphs(font, token, letterSpacing, useKerning);
            var tokenWidth = tokenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
            }
            if (maxWidth > 0 && breakWords && tokenWidth > maxWidth) {
                for (var _u = 0, tokenGlyphs_1 = tokenGlyphs; _u < tokenGlyphs_1.length; _u++) {
                    var glyph = tokenGlyphs_1[_u];
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
            for (var _v = 0, tokenGlyphs_2 = tokenGlyphs; _v < tokenGlyphs_2.length; _v++) {
                var glyph = tokenGlyphs_2[_v];
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
    return LayoutEngine;
}());
export { LayoutEngine };
