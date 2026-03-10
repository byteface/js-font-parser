export class Point {
    x;
    y;
    onCurve;
    endOfContour;
    touched = false;
    constructor(x, y, onCurve = true, endOfContour = false) {
        this.x = x;
        this.y = y;
        this.onCurve = onCurve;
        this.endOfContour = endOfContour;
    }
}
