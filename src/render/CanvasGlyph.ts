import { FontParserTTF } from '../data/FontParserTTF.js';
import { CanvasRenderer, CanvasDrawOptions, CanvasStyleOptions } from '../render/CanvasRenderer.js';

export class CanvasGlyph {

    private LINE_WIDTH: number = 1;
    private STROKE_STYLE: string = "#000000";
    private FILL_STYLE: string = "#000000";
    private GLOBAL_ALPHA: number = 1;
    private SCALE: number = 0.5;
    
    private jitter: number = 0;
    
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

    // TODO - maybe just add jitter as a value to the original method?
    // or extend CanvasFont and call in JitterFont or something like
    private addContourToShapeJitter(
        context: CanvasRenderingContext2D,
        glyph: any,
        startIndex: number,
        count: number,
        scale: number
        ): void {
		// draw each point at a random offset
		var randomOffset = this.jitter;

		var xShift = (Math.random()*randomOffset) - (Math.random()*randomOffset);
		var yShift = (Math.random()*randomOffset) - (Math.random()*randomOffset);

        if (glyph.getPoint(startIndex).endOfContour)
        {
            return;
        }
 
        let offset = 0;
        
        while(offset < count)
        {
            var p0 = glyph.getPoint(startIndex + offset%count);
            var p1 = glyph.getPoint(startIndex + (offset+1)%count);
            
            if (offset == 0)
            {
                //window.console.log("move");
                context.moveTo(p0.x*scale, p0.y*scale);
            }

            if (p0.onCurve)
            {
                if (p1.onCurve)
                {
                    context.lineTo( ( p1.x + Math.random()*xShift )*scale, (p1.y + Math.random()*yShift )*scale );
                    offset++;
                }
                else
                {
                    var p2 = glyph.getPoint(startIndex + (offset+2)%count);
                    
                    if(p2.onCurve)
                    {
                        context.quadraticCurveTo( ( p1.x + Math.random()*xShift ) *scale, (p1.y + Math.random()*yShift )*scale, (p2.x + Math.random()*xShift )*scale, (p2.y + Math.random()*xShift )*scale);
                    }
                    else
                    {
                        context.quadraticCurveTo( ( p1.x + Math.random()*xShift )*scale, (p1.y + Math.random()*yShift )*scale, this.midValue(( p1.x + Math.random()*xShift )*scale, (p2.x + Math.random()*xShift )*scale), this.midValue(p1.y*scale, p2.y*scale));
                    }
                    
                    offset+=2;
                } 
            }
            else
            {
            
            if(!p1.onCurve)
            {
                context.quadraticCurveTo(p0.x*scale, p0.y*scale, this.midValue(p0.x*scale, ( p1.x + Math.random()*xShift )*scale), this.midValue(p0.y*scale, p1.y*scale));
            }
            else
            {
                context.quadraticCurveTo(p0.x*scale, p0.y*scale, ( p1.x + Math.random()*xShift )*scale, p1.y*scale);
            }
            
            offset++;
            
            }
        }
    }


    // how far a point randomly strays
    public setJitter( offset: number )
    {
        this.jitter = offset;
    }

    private midValue(a: number, b: number): number {
        return (a + b) / 2;
    }

    clearCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawString(text: string, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        CanvasRenderer.drawString(this.fontdata, text, canvas, options);
    }

    drawStringWithKerning(text: string, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        CanvasRenderer.drawStringWithKerning(this.fontdata, text, canvas, options);
    }

    drawLayout(layout: Array<{ glyphIndex: number; xAdvance: number; xOffset?: number; yOffset?: number }>, canvasId: string, options: CanvasDrawOptions = {}): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return;
        CanvasRenderer.drawLayout(this.fontdata, layout, canvas, options);
    }
}
