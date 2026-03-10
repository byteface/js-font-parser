import { FontParser } from '../data/FontParser.js';
import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
export class CanvasGlyph {
    LINE_WIDTH = 1;
    STROKE_STYLE = "#000000";
    FILL_STYLE = "#000000";
    GLOBAL_ALPHA = 1;
    SCALE = 0.5;
    fontdata = null;
    diagnostics = [];
    diagnosticKeys = new Set();
    fontLoadedPromise;
    constructor(path) {
        this.fontLoadedPromise = FontParser.load(path)
            .then(ttf_font => {
            this.fontdata = ttf_font;
        })
            .catch(error => {
            this.emitDiagnostic("FONT_LOAD_FAILED", "warning", "render", "Failed to load font.", { error: error instanceof Error ? error.message : String(error) }, "FONT_LOAD_FAILED");
        });
    }
    emitDiagnostic(code, level, phase, message, context, onceKey) {
        if (onceKey && this.diagnosticKeys.has(onceKey))
            return;
        if (onceKey)
            this.diagnosticKeys.add(onceKey);
        this.diagnostics.push({ code, level, phase, message, context });
    }
    getDiagnostics(filter) {
        return this.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
    }
    clearDiagnostics() {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
    }
    // Wrapper method to access the font-loaded promise when needed
    onFontLoaded() {
        return this.fontLoadedPromise;
    }
    setProps(scale) {
        this.SCALE = scale;
    }
    setStyle(lineWidth, strokeStyle, fillStyle, globalAlpha) {
        this.LINE_WIDTH = lineWidth;
        this.STROKE_STYLE = strokeStyle;
        this.FILL_STYLE = fillStyle;
        this.GLOBAL_ALPHA = globalAlpha;
    }
    drawChar(char, canvasId) {
        if (!this.fontdata)
            return null;
        const glyphIndex = this.fontdata.getGlyphIndexByChar(char);
        if (glyphIndex == null)
            return null;
        return this.drawGlyph(glyphIndex, canvasId);
    }
    // draws a glyph by its index (which is not particularly useful)
    drawGlyph(index, canvasId) {
        if (!this.fontdata)
            return null;
        const SCALE = this.SCALE;
        const g = this.fontdata.getGlyph(index);
        const drawingCanvas = document.getElementById(canvasId);
        if (!drawingCanvas || typeof drawingCanvas.getContext !== 'function') {
            this.emitDiagnostic("CANVAS_NOT_FOUND", "warning", "render", "Canvas not found.", { canvasId }, `CANVAS_NOT_FOUND:${canvasId}`);
            return null;
        }
        const context = drawingCanvas.getContext('2d');
        if (!context)
            return null;
        const styles = {
            lineWidth: this.LINE_WIDTH,
            strokeStyle: this.STROKE_STYLE,
            fillStyle: this.FILL_STYLE,
            globalAlpha: this.GLOBAL_ALPHA,
        };
        CanvasRenderer.drawGlyphToContext(context, g, {
            scale: SCALE,
            x: 0,
            y: 0,
            styles,
        });
        return context;
    }
    clearCanvas(context, canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawString(text, canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawString(this.fontdata, text, canvas, options);
    }
    drawStringWithKerning(text, canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawStringWithKerning(this.fontdata, text, canvas, options);
    }
    drawLayout(layout, canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (!this.fontdata)
            return;
        CanvasRenderer.drawLayout(this.fontdata, layout, canvas, options);
    }
}
