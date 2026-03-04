import { FontParser } from '../data/FontParser.js';
var QuickFont = /** @class */ (function () {
    function QuickFont(path) {
        var _this = this;
        this.LINE_WIDTH = 1;
        this.STROKE_STYLE = "#000000";
        this.FILL_STYLE = "#000000";
        this.GLOBAL_ALPHA = 1;
        this.SCALE = 0.5;
        this.jitter = 0;
        this.fontdata = null; // Adjust type if you have a defined type for fontdata
        this.fontLoadedPromise = FontParser.load(path)
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
    QuickFont.prototype.drawChar = function (char, canvasId) {
        var glyphIndex = this.fontdata.getGlyphIndexByChar(char);
        return this.drawGlyph(glyphIndex, canvasId);
    };
    // draws a glyph by its index (which is not particularly useful)
    QuickFont.prototype.drawGlyph = function (index, canvasId) {
        var SCALE = this.SCALE;
        var g = this.fontdata.getGlyph(index);
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
                this.addContourToShape(context, g, firstIndex, counter, SCALE);
                firstIndex = i + 1;
                counter = 0;
            }
        }
        context.closePath();
        context.stroke();
        context.fill();
        return context;
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
    // TODO - maybe just add jitter as a value to the original method?
    // or extend CanvasFont and call in JitterFont or something like
    QuickFont.prototype.addContourToShapeJitter = function (context, glyph, startIndex, count, scale) {
        // draw each point at a random offset
        var randomOffset = this.jitter;
        var xShift = (Math.random() * randomOffset) - (Math.random() * randomOffset);
        var yShift = (Math.random() * randomOffset) - (Math.random() * randomOffset);
        if (glyph.getPoint(startIndex).endOfContour) {
            return;
        }
        var offset = 0;
        while (offset < count) {
            var p0 = glyph.getPoint(startIndex + offset % count);
            var p1 = glyph.getPoint(startIndex + (offset + 1) % count);
            if (offset == 0) {
                //window.console.log("move");
                context.moveTo(p0.x * scale, p0.y * scale);
            }
            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo((p1.x + Math.random() * xShift) * scale, (p1.y + Math.random() * yShift) * scale);
                    offset++;
                }
                else {
                    var p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (p2.onCurve) {
                        context.quadraticCurveTo((p1.x + Math.random() * xShift) * scale, (p1.y + Math.random() * yShift) * scale, (p2.x + Math.random() * xShift) * scale, (p2.y + Math.random() * xShift) * scale);
                    }
                    else {
                        context.quadraticCurveTo((p1.x + Math.random() * xShift) * scale, (p1.y + Math.random() * yShift) * scale, this.midValue((p1.x + Math.random() * xShift) * scale, (p2.x + Math.random() * xShift) * scale), this.midValue(p1.y * scale, p2.y * scale));
                    }
                    offset += 2;
                }
            }
            else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, this.midValue(p0.x * scale, (p1.x + Math.random() * xShift) * scale), this.midValue(p0.y * scale, p1.y * scale));
                }
                else {
                    context.quadraticCurveTo(p0.x * scale, p0.y * scale, (p1.x + Math.random() * xShift) * scale, p1.y * scale);
                }
                offset++;
            }
        }
    };
    // how far a point randomly strays
    QuickFont.prototype.setJitter = function (offset) {
        this.jitter - offset;
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
