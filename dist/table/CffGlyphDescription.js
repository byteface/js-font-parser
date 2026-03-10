export class CffGlyphDescription {
    points;
    endPts;
    xMin;
    yMin;
    xMax;
    yMax;
    constructor(points, endPts) {
        this.points = points;
        this.endPts = endPts;
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        this.xMin = xs.length ? Math.min(...xs) : 0;
        this.yMin = ys.length ? Math.min(...ys) : 0;
        this.xMax = xs.length ? Math.max(...xs) : 0;
        this.yMax = ys.length ? Math.max(...ys) : 0;
    }
    getEndPtOfContours(i) {
        return this.endPts[i] ?? 0;
    }
    getFlags(i) {
        return this.points[i]?.onCurve ? 0x01 : 0x00;
    }
    getXCoordinate(i) {
        return this.points[i]?.x ?? 0;
    }
    getYCoordinate(i) {
        return this.points[i]?.y ?? 0;
    }
    getXMaximum() {
        return this.xMax;
    }
    getXMinimum() {
        return this.xMin;
    }
    getYMaximum() {
        return this.yMax;
    }
    getYMinimum() {
        return this.yMin;
    }
    isComposite() {
        return false;
    }
    getPointCount() {
        return this.points.length;
    }
    getContourCount() {
        return this.endPts.length;
    }
    resolve() {
        // no-op
    }
}
