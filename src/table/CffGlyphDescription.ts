import { IGlyphDescription } from './IGlyphDescription.js';

type CffPoint = { x: number; y: number; onCurve: boolean; endOfContour: boolean };

export class CffGlyphDescription implements IGlyphDescription {
    private points: CffPoint[];
    private endPts: number[];
    private xMin: number;
    private yMin: number;
    private xMax: number;
    private yMax: number;

    constructor(points: CffPoint[], endPts: number[]) {
        this.points = points;
        this.endPts = endPts;
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        this.xMin = xs.length ? Math.min(...xs) : 0;
        this.yMin = ys.length ? Math.min(...ys) : 0;
        this.xMax = xs.length ? Math.max(...xs) : 0;
        this.yMax = ys.length ? Math.max(...ys) : 0;
    }

    getEndPtOfContours(i: number): number {
        return this.endPts[i] ?? 0;
    }
    getFlags(i: number): number {
        return this.points[i]?.onCurve ? 0x01 : 0x00;
    }
    getXCoordinate(i: number): number {
        return this.points[i]?.x ?? 0;
    }
    getYCoordinate(i: number): number {
        return this.points[i]?.y ?? 0;
    }
    getXMaximum(): number {
        return this.xMax;
    }
    getXMinimum(): number {
        return this.xMin;
    }
    getYMaximum(): number {
        return this.yMax;
    }
    getYMinimum(): number {
        return this.yMin;
    }
    isComposite(): boolean {
        return false;
    }
    getPointCount(): number {
        return this.points.length;
    }
    getContourCount(): number {
        return this.endPts.length;
    }
    resolve(): void {
        // no-op
    }
}
