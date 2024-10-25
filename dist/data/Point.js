var Point = /** @class */ (function () {
    function Point(x, y, onCurve, endOfContour) {
        if (onCurve === void 0) { onCurve = true; }
        if (endOfContour === void 0) { endOfContour = false; }
        this.x = x;
        this.y = y;
        this.onCurve = onCurve;
        this.endOfContour = endOfContour;
        this.touched = false; // Initialize as false by default
    }
    return Point;
}());
export { Point };
