var CffGlyphDescription = /** @class */ (function () {
    function CffGlyphDescription(points, endPts) {
        this.points = points;
        this.endPts = endPts;
        var xs = points.map(function (p) { return p.x; });
        var ys = points.map(function (p) { return p.y; });
        this.xMin = xs.length ? Math.min.apply(Math, xs) : 0;
        this.yMin = ys.length ? Math.min.apply(Math, ys) : 0;
        this.xMax = xs.length ? Math.max.apply(Math, xs) : 0;
        this.yMax = ys.length ? Math.max.apply(Math, ys) : 0;
    }
    CffGlyphDescription.prototype.getEndPtOfContours = function (i) {
        var _a;
        return (_a = this.endPts[i]) !== null && _a !== void 0 ? _a : 0;
    };
    CffGlyphDescription.prototype.getFlags = function (i) {
        var _a;
        return ((_a = this.points[i]) === null || _a === void 0 ? void 0 : _a.onCurve) ? 0x01 : 0x00;
    };
    CffGlyphDescription.prototype.getXCoordinate = function (i) {
        var _a, _b;
        return (_b = (_a = this.points[i]) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
    };
    CffGlyphDescription.prototype.getYCoordinate = function (i) {
        var _a, _b;
        return (_b = (_a = this.points[i]) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
    };
    CffGlyphDescription.prototype.getXMaximum = function () {
        return this.xMax;
    };
    CffGlyphDescription.prototype.getXMinimum = function () {
        return this.xMin;
    };
    CffGlyphDescription.prototype.getYMaximum = function () {
        return this.yMax;
    };
    CffGlyphDescription.prototype.getYMinimum = function () {
        return this.yMin;
    };
    CffGlyphDescription.prototype.isComposite = function () {
        return false;
    };
    CffGlyphDescription.prototype.getPointCount = function () {
        return this.points.length;
    };
    CffGlyphDescription.prototype.getContourCount = function () {
        return this.endPts.length;
    };
    CffGlyphDescription.prototype.resolve = function () {
        // no-op
    };
    return CffGlyphDescription;
}());
export { CffGlyphDescription };
