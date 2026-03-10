import { Point } from './Point.js';
import { IGlyphDescription } from '../table/IGlyphDescription.js';
export declare class GlyphData {
    leftSideBearing: number;
    advanceWidth: number;
    points: Point[] | null;
    isCubic: boolean;
    includePhantoms: boolean;
    constructor(gd: IGlyphDescription, lsb: number, advance: number, options?: {
        isCubic?: boolean;
        includePhantoms?: boolean;
    });
    getPoint(i: number): Point | undefined;
    getPointCount(): number;
    reset(): void;
    scale(factor: number): void;
    describe(gd: IGlyphDescription): void;
}
