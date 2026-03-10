import { FontParser } from '../data/FontParser.js';
import { CanvasRenderer, CanvasDrawOptions, CanvasStyleOptions } from '../render/CanvasRenderer.js';
import { GlyphData } from '../data/GlyphData.js';
import type { Diagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';

type FontForCanvasGlyph = {
    getGlyphIndexByChar: (char: string) => number | null;
    getGlyph: (index: number) => GlyphData | null;
    getGlyphByChar: (char: string) => GlyphData | null;
    getKerningValue?: (left: string, right: string) => number;
};

export class CanvasGlyph {

    private LINE_WIDTH: number = 1;
    private STROKE_STYLE: string = "#000000";
    private FILL_STYLE: string = "#000000";
    private GLOBAL_ALPHA: number = 1;
    private SCALE: number = 0.5;
    
    private fontdata: FontForCanvasGlyph | null = null;
    private diagnostics: Diagnostic[] = [];
    private diagnosticKeys = new Set<string>();

    private fontLoadedPromise: Promise<void>;

    constructor(path: string) {
        this.fontLoadedPromise = FontParser.load(path)
            .then(ttf_font => {
                this.fontdata = ttf_font;
            })
            .catch(error => {
                this.emitDiagnostic(
                    "FONT_LOAD_FAILED",
                    "warning",
                    "render",
                    "Failed to load font.",
                    { error: error instanceof Error ? error.message : String(error) },
                    "FONT_LOAD_FAILED"
                );
            });
    }

    private emitDiagnostic(
        code: string,
        level: 'warning' | 'info',
        phase: 'parse' | 'layout' | 'render',
        message: string,
        context?: Record<string, unknown>,
        onceKey?: string
    ): void {
        if (onceKey && this.diagnosticKeys.has(onceKey)) return;
        if (onceKey) this.diagnosticKeys.add(onceKey);
        this.diagnostics.push({ code, level, phase, message, context });
    }

    public getDiagnostics(filter?: DiagnosticFilter): Diagnostic[] {
        return this.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
    }

    public clearDiagnostics(): void {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
    }

    // Wrapper method to access the font-loaded promise when needed
    public onFontLoaded(): Promise<void> {
        return this.fontLoadedPromise;
    }

    setProps(scale: number): void {
        this.SCALE = scale;
    }

    setStyle(lineWidth: number, strokeStyle: string, fillStyle: string, globalAlpha: number): void {
        this.LINE_WIDTH = lineWidth;
        this.STROKE_STYLE = strokeStyle;
        this.FILL_STYLE = fillStyle;
        this.GLOBAL_ALPHA = globalAlpha;
    }

    drawChar(char: string, canvasId:string): CanvasRenderingContext2D | null {
        if (!this.fontdata) return null;
        const glyphIndex = this.fontdata.getGlyphIndexByChar(char);
        if (glyphIndex == null) return null;
        return this.drawGlyph(glyphIndex, canvasId);
    }

    // draws a glyph by its index (which is not particularly useful)
    drawGlyph(index: number, canvasId: string): CanvasRenderingContext2D | null {
        if (!this.fontdata) return null;
        const SCALE = this.SCALE;
        const g = this.fontdata.getGlyph(index);
        const drawingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
        
        if (!drawingCanvas || typeof (drawingCanvas as any).getContext !== 'function') {
            this.emitDiagnostic(
                "CANVAS_NOT_FOUND",
                "warning",
                "render",
                "Canvas not found.",
                { canvasId },
                `CANVAS_NOT_FOUND:${canvasId}`
            );
            return null;
        }

        const context = drawingCanvas.getContext('2d');
        if (!context) return null;

        const styles: CanvasStyleOptions = {
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
    clearCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawString(text: string, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        if (typeof (canvas as any).getContext !== 'function') return;
        if (!this.fontdata) return;
        CanvasRenderer.drawString(this.fontdata, text, canvas, options);
    }

    drawStringWithKerning(text: string, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        if (typeof (canvas as any).getContext !== 'function') return;
        if (!this.fontdata) return;
        CanvasRenderer.drawStringWithKerning(this.fontdata, text, canvas, options);
    }

    drawLayout(layout: Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        if (typeof (canvas as any).getContext !== 'function') return;
        if (!this.fontdata) return;
        CanvasRenderer.drawLayout(this.fontdata, layout, canvas, options);
    }
}
