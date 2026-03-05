import { Point } from './Point.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';

export class GlyphData {
    leftSideBearing: number;
    advanceWidth: number;
    points: Point[] | null;
    isCubic: boolean;
    includePhantoms: boolean;
  
    constructor(gd: IGlyphDescription, lsb: number, advance: number, options?: { isCubic?: boolean; includePhantoms?: boolean }) {
      this.leftSideBearing = lsb;
      this.advanceWidth = advance;
      this.points = null;
      this.isCubic = options?.isCubic ?? false;
      this.includePhantoms = options?.includePhantoms ?? true;
      this.describe(gd);
    }
  
    getPoint(i: number): Point | undefined {
      return this.points ? this.points[i] : undefined;
    }
  
    getPointCount(): number {
      return this.points ? this.points.length : 0;
    }
  
    reset(): void {
      // Implement reset logic if needed
    }
  
    scale(factor: number): void {
      if (!this.points) return;
  
      for (let i = 0; i < this.points.length; i++) {
        this.points[i].x = ((this.points[i].x << 10) * factor) >> 26;
        this.points[i].y = ((this.points[i].y << 10) * factor) >> 26;
      }
  
      this.leftSideBearing = (this.leftSideBearing * factor) >> 6;
      this.advanceWidth = (this.advanceWidth * factor) >> 6;
    }
  
    describe(gd: IGlyphDescription): void {
      let endPtIndex = 0;
      this.points = [];
  
      for (let i = 0; i < gd.getPointCount(); i++) {
        const endPt = gd.getEndPtOfContours(endPtIndex) === i;
        if (endPt) {
          endPtIndex++;
        }
        this.points.push(new Point(gd.getXCoordinate(i), gd.getYCoordinate(i), (gd.getFlags(i) & 0x01) !== 0, endPt));
      }
  
      if (this.includePhantoms) {
        // Append the origin and advanceWidth points (n & n+1)
        this.points.push(new Point(0, 0, true, true));
        this.points.push(new Point(this.advanceWidth, 0, true, true));
      }
    }
  }
