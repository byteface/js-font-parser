import { FontParserTTF } from '../data/FontParserTTF.js';
var QuickFont = /** @class */ (function () {
    function QuickFont(path) {
        var _this = this;
        this.LINE_WIDTH = 1;
        this.STROKE_STYLE = "#000000";
        this.FILL_STYLE = "#000000";
        this.GLOBAL_ALPHA = 1;
        this.SCALE = 0.5;
        this.fontdata = null; // Adjust type if you have a defined type for fontdata
        this.wobble = 30;
        this.fontLoadedPromise = FontParserTTF.load(path)
            .then(function (ttf_font) {
            _this.fontdata = ttf_font;
        })
            .catch(function (error) {
            console.error("Failed to load font:", error);
        });
    }
    // Wrapper method to access the font-loaded promise when needed
    QuickFont.prototype.onFontLoaded = function () {
        return this.fontLoadedPromise;
    };
    QuickFont.prototype.setProps = function (scale) {
        this.SCALE = scale;
    };
    QuickFont.prototype.setStyle = function (lineWidth, strokeStyle, fillStyle, globalAlpha) {
        this.LINE_WIDTH = lineWidth;
        this.STROKE_STYLE = strokeStyle;
        this.FILL_STYLE = fillStyle;
        this.GLOBAL_ALPHA = globalAlpha;
    };
    QuickFont.prototype.setWobble = function (offset) {
        this.wobble = offset;
    };
    QuickFont.prototype.drawGlyph = function (char, canvasId) {
        var SCALE = this.SCALE;
        var g = this.fontdata.getGlyph(char);
        var drawingCanvas = document.getElementById(canvasId);
        if (!drawingCanvas) {
            console.error("Canvas not found.");
            return null;
        }
        var context = drawingCanvas.getContext('2d');
        if (!context)
            return null;
        context.lineWidth = this.LINE_WIDTH;
        context.strokeStyle = this.STROKE_STYLE;
        context.fillStyle = this.FILL_STYLE;
        context.globalAlpha = this.GLOBAL_ALPHA;
        context.beginPath();
        var firstIndex = 0;
        var counter = 0;
        for (var i = 0; i < g.getPointCount(); i++) {
            counter++;
            if (g.getPoint(i).endOfContour) {
                this.addContourToShapeWobble(context, g, firstIndex, counter, SCALE);
                firstIndex = i + 1;
                counter = 0;
            }
        }
        context.closePath();
        context.stroke();
        context.fill();
        return context;
    };
    QuickFont.prototype.addContourToShapeWobble = function (context, glyph, startIndex, count, scale) {
        var randomOffset = this.wobble;
        var xShift = (Math.random() * randomOffset) - (Math.random() * randomOffset);
        var yShift = (Math.random() * randomOffset) - (Math.random() * randomOffset);
        if (glyph.getPoint(startIndex).endOfContour)
            return;
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + offset % count);
            var p1 = glyph.getPoint(startIndex + (offset + 1) % count);
            if (offset === 0) {
                context.moveTo(p0.x * scale, p0.y * scale);
            }
            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo((p1.x + xShift) * scale, (p1.y + yShift) * scale);
                    offset++;
                }
                else {
                    var p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (p2.onCurve) {
                        context.quadraticCurveTo((p1.x + xShift) * scale, (p1.y + yShift) * scale, (p2.x + xShift) * scale, (p2.y + xShift) * scale);
                    }
                    else {
                        context.quadraticCurveTo((p1.x + xShift) * scale, (p1.y + yShift) * scale, this.midValue((p1.x + xShift) * scale, (p2.x + xShift) * scale), this.midValue(p1.y * scale, p2.y * scale));
                    }
                    offset += 2;
                }
            }
            else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, this.midValue(p0.x * scale, (p1.x + xShift) * scale), this.midValue(p0.y * scale, p1.y * scale));
                }
                else {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, (p1.x + xShift) * scale, p1.y * scale);
                }
                offset++;
            }
        }
    };
    QuickFont.prototype.addContourToShape = function (context, glyph, startIndex, count, scale) {
        if (glyph.getPoint(startIndex).endOfContour)
            return;
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + offset % count);
            var p1 = glyph.getPoint(startIndex + (offset + 1) % count);
            if (offset === 0) {
                context.moveTo(p0.x * scale, p0.y * scale);
            }
            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo(p1.x * scale, p1.y * scale);
                    offset++;
                }
                else {
                    var p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (p2.onCurve) {
                        context.quadraticCurveTo(p1.x * scale, p1.y * scale, p2.x * scale, p2.y * scale);
                    }
                    else {
                        context.quadraticCurveTo(p1.x * scale, p1.y * scale, this.midValue(p1.x * scale, p2.x * scale), this.midValue(p1.y * scale, p2.y * scale));
                    }
                    offset += 2;
                }
            }
            else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, this.midValue(p0.x * scale, p1.x * scale), this.midValue(p0.y * scale, p1.y * scale));
                }
                else {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, p1.x * scale, p1.y * scale);
                }
                offset++;
            }
        }
    };
    QuickFont.prototype.midValue = function (a, b) {
        return (a + b) / 2;
    };
    QuickFont.prototype.clearCanvas = function (context, canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    };
    return QuickFont;
}());
export { QuickFont };
