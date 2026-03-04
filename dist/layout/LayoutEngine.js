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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (options === void 0) { options = {}; }
        var maxWidth = (_a = options.maxWidth) !== null && _a !== void 0 ? _a : 0;
        var align = (_b = options.align) !== null && _b !== void 0 ? _b : 'left';
        var letterSpacing = (_c = options.letterSpacing) !== null && _c !== void 0 ? _c : 0;
        var useKerning = (_d = options.useKerning) !== null && _d !== void 0 ? _d : true;
        var hhea = (_e = font.getTableByType) === null || _e === void 0 ? void 0 : _e.call(font, 0x68686561); // hhea
        var head = (_f = font.getTableByType) === null || _f === void 0 ? void 0 : _f.call(font, 0x68656164); // head
        var unitsPerEm = (_g = head === null || head === void 0 ? void 0 : head.unitsPerEm) !== null && _g !== void 0 ? _g : 1000;
        var lineHeight = (_h = options.lineHeight) !== null && _h !== void 0 ? _h : (((_j = hhea === null || hhea === void 0 ? void 0 : hhea.ascender) !== null && _j !== void 0 ? _j : unitsPerEm * 0.8) - ((_k = hhea === null || hhea === void 0 ? void 0 : hhea.descender) !== null && _k !== void 0 ? _k : -unitsPerEm * 0.2) + ((_l = hhea === null || hhea === void 0 ? void 0 : hhea.lineGap) !== null && _l !== void 0 ? _l : 0));
        var lines = [];
        var current = [];
        var cursorX = 0;
        var pushLine = function (isLastLine) {
            var width = cursorX;
            lines.push({ glyphs: current, width: width, isLastLine: isLastLine });
            current = [];
            cursorX = 0;
        };
        var tokens = this.tokenize(text);
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token === '\n') {
                pushLine(false);
                continue;
            }
            var tokenGlyphs = this.buildTokenGlyphs(font, token, letterSpacing, useKerning);
            var tokenWidth = tokenGlyphs.reduce(function (sum, g) { return sum + g.advance; }, 0);
            if (maxWidth > 0 && cursorX > 0 && cursorX + tokenWidth > maxWidth) {
                pushLine(false);
            }
            for (var _m = 0, tokenGlyphs_1 = tokenGlyphs; _m < tokenGlyphs_1.length; _m++) {
                var glyph = tokenGlyphs_1[_m];
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
            else if (align === 'justify' && !line.isLastLine && maxWidth > 0) {
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
    LayoutEngine.tokenize = function (text) {
        var tokens = [];
        var buffer = '';
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            if (ch === '\n') {
                if (buffer)
                    tokens.push(buffer);
                tokens.push('\n');
                buffer = '';
                continue;
            }
            if (/\s/.test(ch)) {
                if (buffer)
                    tokens.push(buffer);
                tokens.push(ch);
                buffer = '';
                continue;
            }
            buffer += ch;
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
        var spaces = line.glyphs.filter(function (g) { return g.char === ' '; });
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
    return LayoutEngine;
}());
export { LayoutEngine };
