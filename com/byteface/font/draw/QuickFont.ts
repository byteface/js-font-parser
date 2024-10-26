import { FontParserTTF } from '../data/FontParserTTF.js';

export class QuickFont {

    private LINE_WIDTH: number = 1;
    private STROKE_STYLE: string = "#000000";
    private FILL_STYLE: string = "#000000";
    private GLOBAL_ALPHA: number = 1;
    private SCALE: number = 0.5;
    
    private fontdata: any = null;  // Adjust type if you have a defined type for fontdata

    private fontLoadedPromise: Promise<void>;

    constructor(path: string) {
        this.fontLoadedPromise = FontParserTTF.load(path)
            .then(ttf_font => {
                this.fontdata = ttf_font;
            })
            .catch(error => {
                console.error("Failed to load font:", error);
            });
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
        const glyphIndex = this.fontdata.getGlyphIndexByChar(char);
        return this.drawGlyph(glyphIndex, canvasId);
    }

    // draws a glyph by its index (which is not particularly useful)
    drawGlyph(index: string, canvasId: string): CanvasRenderingContext2D | null {
        const SCALE = this.SCALE;
        const g = this.fontdata.getGlyph(index);
        const drawingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
        
        if (!drawingCanvas) {
            console.error("Canvas not found.");
            return null;
        }

        const context = drawingCanvas.getContext('2d');
        if (!context) return null;

        context.lineWidth = this.LINE_WIDTH;
        context.strokeStyle = this.STROKE_STYLE;
        context.fillStyle = this.FILL_STYLE;
        context.globalAlpha = this.GLOBAL_ALPHA;
        context.beginPath();

        let firstIndex = 0;
        let counter = 0;

        for (let i = 0; i < g.getPointCount(); i++) {
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
    }

    private addContourToShape(
        context: CanvasRenderingContext2D,
        glyph: any,
        startIndex: number,
        count: number,
        scale: number
    ): void {
        if (glyph.getPoint(startIndex).endOfContour) return;

        let offset = 0;

        while (offset < count) {
            const p0 = glyph.getPoint(startIndex + offset % count);
            const p1 = glyph.getPoint(startIndex + (offset + 1) % count);

            if (offset === 0) {
                context.moveTo(p0.x * scale, p0.y * scale);
            }

            if (p0.onCurve) {
                if (p1.onCurve) {
                    context.lineTo(p1.x * scale, p1.y * scale);
                    offset++;
                } else {
                    const p2 = glyph.getPoint(startIndex + (offset + 2) % count);
                    if (p2.onCurve) {
                        context.quadraticCurveTo(
                            p1.x * scale, p1.y * scale, p2.x * scale, p2.y * scale
                        );
                    } else {
                        context.quadraticCurveTo(
                            p1.x * scale, p1.y * scale, 
                            this.midValue(p1.x * scale, p2.x * scale), 
                            this.midValue(p1.y * scale, p2.y * scale)
                        );
                    }
                    offset += 2;
                }
            } else {
                if (!p1.onCurve) {
                    context.quadraticCurveTo(
                        p0.x * scale, p0.y * scale, 
                        this.midValue(p0.x * scale, p1.x * scale), 
                        this.midValue(p0.y * scale, p1.y * scale)
                    );
                } else {
                    context.quadraticCurveTo(
                        p0.x * scale, p0.y * scale, p1.x * scale, p1.y * scale
                    );
                }
                offset++;
            }
        }
    }

    private midValue(a: number, b: number): number {
        return (a + b) / 2;
    }

    clearCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
}
