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
import { Table } from '../table/Table.js';
var SVGFont = /** @class */ (function () {
    function SVGFont() {
    }
    SVGFont.glyphToPath = function (glyph, scale, offsetX, offsetY) {
        var d = "";
        var firstindex = 0;
        var counter = 0;
        for (var i = 0; i < glyph.getPointCount(); i++) {
            counter++;
            var point = glyph.getPoint(i);
            if (point && point.endOfContour) {
                d += this.contourToPath(glyph, firstindex, counter, scale, offsetX, offsetY);
                firstindex = i + 1;
                counter = 0;
            }
        }
        return d;
    };
    SVGFont.contourToPath = function (glyph, startIndex, count, scale, offsetX, offsetY) {
        var startPoint = glyph.getPoint(startIndex);
        if (!startPoint || startPoint.endOfContour)
            return "";
        var d = "";
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + (offset % count));
            var p1 = glyph.getPoint(startIndex + ((offset + 1) % count));
            if (!p0 || !p1)
                break;
            if (offset === 0) {
                d += "M ".concat((p0.x * scale) + offsetX, " ").concat((-p0.y * scale) + offsetY, " ");
            }
            if (p0.onCurve) {
                if (p1.onCurve) {
                    d += "L ".concat((p1.x * scale) + offsetX, " ").concat((-p1.y * scale) + offsetY, " ");
                    offset++;
                }
                else {
                    var p2 = glyph.getPoint(startIndex + ((offset + 2) % count));
                    if (!p2)
                        break;
                    if (p2.onCurve) {
                        d += "Q ".concat((p1.x * scale) + offsetX, " ").concat((-p1.y * scale) + offsetY, ", ").concat((p2.x * scale) + offsetX, " ").concat((-p2.y * scale) + offsetY, " ");
                    }
                    else {
                        var mx = (p1.x + p2.x) / 2;
                        var my = (p1.y + p2.y) / 2;
                        d += "Q ".concat((p1.x * scale) + offsetX, " ").concat((-p1.y * scale) + offsetY, ", ").concat((mx * scale) + offsetX, " ").concat((-my * scale) + offsetY, " ");
                    }
                    offset += 2;
                }
            }
            else {
                if (!p1.onCurve) {
                    var mx = (p0.x + p1.x) / 2;
                    var my = (p0.y + p1.y) / 2;
                    d += "Q ".concat((p0.x * scale) + offsetX, " ").concat((-p0.y * scale) + offsetY, ", ").concat((mx * scale) + offsetX, " ").concat((-my * scale) + offsetY, " ");
                }
                else {
                    d += "Q ".concat((p0.x * scale) + offsetX, " ").concat((-p0.y * scale) + offsetY, ", ").concat((p1.x * scale) + offsetX, " ").concat((-p1.y * scale) + offsetY, " ");
                }
                offset++;
            }
        }
        d += "Z ";
        return d;
    };
    SVGFont.exportStringSvg = function (font, text, options) {
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        var scale = (_a = options.scale) !== null && _a !== void 0 ? _a : 1;
        var letterSpacing = (_b = options.letterSpacing) !== null && _b !== void 0 ? _b : 0;
        var stroke = (_c = options.stroke) !== null && _c !== void 0 ? _c : "#111";
        var fill = (_d = options.fill) !== null && _d !== void 0 ? _d : "none";
        var penX = 0;
        var combinedPath = "";
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            var glyph = font.getGlyphByChar(ch);
            if (glyph) {
                combinedPath += this.glyphToPath(glyph, scale, penX, 0);
                penX += (glyph.advanceWidth * scale) + letterSpacing;
            }
            else {
                penX += letterSpacing;
            }
        }
        var ascent = font.getAscent();
        var descent = font.getDescent();
        var height = ascent - descent;
        var width = Math.max(1, penX);
        var viewBox = "0 ".concat(-ascent * scale, " ").concat(width, " ").concat(height * scale);
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"".concat(width, "\" height=\"").concat(height * scale, "\" viewBox=\"").concat(viewBox, "\">") +
            "<path d=\"".concat(combinedPath, "\" stroke=\"").concat(stroke, "\" fill=\"").concat(fill, "\"/>") +
            "</svg>";
    };
    SVGFont.exportFontSummarySvg = function (font, options) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        var head = font.getTableByType(Table.head);
        var unitsPerEm = (_a = head === null || head === void 0 ? void 0 : head.unitsPerEm) !== null && _a !== void 0 ? _a : 1000;
        var scale = (_b = options.scale) !== null && _b !== void 0 ? _b : (1000 / unitsPerEm);
        return this.exportStringSvg(font, "Hello World", __assign(__assign({}, options), { scale: scale }));
    };
    return SVGFont;
}());
export { SVGFont };
