import { FontParser } from '../data/FontParser.js';
import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
var CanvasGlyph = /** @class */ (function () {
    function CanvasGlyph(path) {
        var _this = this;
        this.LINE_WIDTH = 1;
        this.STROKE_STYLE = "#000000";
        this.FILL_STYLE = "#000000";
        this.GLOBAL_ALPHA = 1;
        this.SCALE = 0.5;
        this.jitter = 0;
        this.fontdata = null;
        this.diagnostics = [];
        this.diagnosticKeys = new Set();
        this.fontLoadedPromise = FontParser.load(path)
            .then(function (ttf_font) {
            _this.fontdata = ttf_font;
        })
            .catch(function (error) {
            _this.emitDiagnostic("FONT_LOAD_FAILED", "warning", "render", "Failed to load font.", { error: error instanceof Error ? error.message : String(error) }, "FONT_LOAD_FAILED");
        });
    }
    CanvasGlyph.prototype.emitDiagnostic = function (code, level, phase, message, context, onceKey) {
        if (onceKey && this.diagnosticKeys.has(onceKey))
            return;
        if (onceKey)
            this.diagnosticKeys.add(onceKey);
        this.diagnostics.push({ code: code, level: level, phase: phase, message: message, context: context });
    };
    CanvasGlyph.prototype.getDiagnostics = function (filter) {
        return this.diagnostics.filter(function (d) { return matchesDiagnosticFilter(d, filter); }).slice();
    };
    CanvasGlyph.prototype.clearDiagnostics = function () {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
    };
    // Wrapper method to access the font-loaded promise when needed
    CanvasGlyph.prototype.onFontLoaded = function () {
        return this.fontLoadedPromise;
    };
    CanvasGlyph.prototype.setProps = function (scale) {
        this.SCALE = scale;
    };
    CanvasGlyph.prototype.setStyle = function (lineWidth, strokeStyle, fillStyle, globalAlpha) {
        this.LINE_WIDTH = lineWidth;
        this.STROKE_STYLE = strokeStyle;
        this.FILL_STYLE = fillStyle;
        this.GLOBAL_ALPHA = globalAlpha;
    };
    CanvasGlyph.prototype.drawChar = function (char, canvasId) {
        if (!this.fontdata)
            return null;
        var glyphIndex = this.fontdata.getGlyphIndexByChar(char);
        if (glyphIndex == null)
            return null;
        return this.drawGlyph(glyphIndex, canvasId);
    };
    // draws a glyph by its index (which is not particularly useful)
    CanvasGlyph.prototype.drawGlyph = function (index, canvasId) {
        if (!this.fontdata)
            return null;
        var SCALE = this.SCALE;
        var g = this.fontdata.getGlyph(index);
        var drawingCanvas = document.getElementById(canvasId);
        if (!drawingCanvas || typeof drawingCanvas.getContext !== 'function') {
            this.emitDiagnostic("CANVAS_NOT_FOUND", "warning", "render", "Canvas not found.", { canvasId: canvasId }, "CANVAS_NOT_FOUND:".concat(canvasId));
            return null;
        }
        var context = drawingCanvas.getContext('2d');
        if (!context)
            return null;
        var styles = {
            lineWidth: this.LINE_WIDTH,
            strokeStyle: this.STROKE_STYLE,
            fillStyle: this.FILL_STYLE,
            globalAlpha: this.GLOBAL_ALPHA,
        };
        CanvasRenderer.drawGlyphToContext(context, g, {
            scale: SCALE,
            x: 0,
            y: 0,
            styles: styles,
        });
        return context;
    };
    // TODO - maybe just add jitter as a value to the original method?
    // or extend CanvasFont and call in JitterFont or something like
    CanvasGlyph.prototype.addContourToShapeJitter = function (context, glyph, startIndex, count, scale) {
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
                        context.quadraticCurveTo((p1.x + Math.random() * xShift) * scale, (p1.y + Math.random() * yShift) * scale, (p2.x + Math.random() * xShift) * scale, (p2.y + Math.random() * yShift) * scale);
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
    CanvasGlyph.prototype.setJitter = function (offset) {
        this.jitter = offset;
    };
    CanvasGlyph.prototype.midValue = function (a, b) {
        return (a + b) / 2;
    };
    CanvasGlyph.prototype.clearCanvas = function (context, canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    };
    CanvasGlyph.prototype.drawString = function (text, canvasId, options) {
        if (options === void 0) { options = {}; }
        var canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawString(this.fontdata, text, canvas, options);
    };
    CanvasGlyph.prototype.drawStringWithKerning = function (text, canvasId, options) {
        if (options === void 0) { options = {}; }
        var canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawStringWithKerning(this.fontdata, text, canvas, options);
    };
    CanvasGlyph.prototype.drawLayout = function (layout, canvasId, options) {
        if (options === void 0) { options = {}; }
        var canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawLayout(this.fontdata, layout, canvas, options);
    };
    return CanvasGlyph;
}());
export { CanvasGlyph };
