import { IGlyphDescription } from './IGlyphDescription.js';
type CffPoint = {
    x: number;
    y: number;
    onCurve: boolean;
    endOfContour: boolean;
};
export declare class CffGlyphDescription implements IGlyphDescription {
    private points;
    private endPts;
    private xMin;
    private yMin;
    private xMax;
    private yMax;
    constructor(points: CffPoint[], endPts: number[]);
    getEndPtOfContours(i: number): number;
    getFlags(i: number): number;
    getXCoordinate(i: number): number;
    getYCoordinate(i: number): number;
    getXMaximum(): number;
    getXMinimum(): number;
    getYMaximum(): number;
    getYMinimum(): number;
    isComposite(): boolean;
    getPointCount(): number;
    getContourCount(): number;
    resolve(): void;
}
export {};
