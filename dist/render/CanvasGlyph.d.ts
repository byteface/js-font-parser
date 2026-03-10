import { CanvasDrawOptions } from '../render/CanvasRenderer.js';
import type { Diagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
export declare class CanvasGlyph {
    private LINE_WIDTH;
    private STROKE_STYLE;
    private FILL_STYLE;
    private GLOBAL_ALPHA;
    private SCALE;
    private fontdata;
    private diagnostics;
    private diagnosticKeys;
    private fontLoadedPromise;
    constructor(path: string);
    private emitDiagnostic;
    getDiagnostics(filter?: DiagnosticFilter): Diagnostic[];
    clearDiagnostics(): void;
    onFontLoaded(): Promise<void>;
    setProps(scale: number): void;
    setStyle(lineWidth: number, strokeStyle: string, fillStyle: string, globalAlpha: number): void;
    drawChar(char: string, canvasId: string): CanvasRenderingContext2D | null;
    drawGlyph(index: number, canvasId: string): CanvasRenderingContext2D | null;
    clearCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void;
    drawString(text: string, canvasId: string, options?: CanvasDrawOptions): void;
    drawStringWithKerning(text: string, canvasId: string, options?: CanvasDrawOptions): void;
    drawLayout(layout: Array<{
        glyphIndex: number;
        xAdvance: number;
        xOffset?: number;
        yOffset?: number;
    }>, canvasId: string, options?: CanvasDrawOptions): void;
}
