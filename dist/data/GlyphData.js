import { Point } from './Point.js';
var GlyphData = /** @class */ (function () {
    function GlyphData(gd, lsb, advance) {
        this.leftSideBearing = lsb;
        this.advanceWidth = advance;
        this.points = null;
        this.describe(gd);
    }
    GlyphData.prototype.getPoint = function (i) {
        return this.points ? this.points[i] : undefined;
    };
    GlyphData.prototype.getPointCount = function () {
        return this.points ? this.points.length : 0;
    };
    GlyphData.prototype.reset = function () {
        // Implement reset logic if needed
    };
    GlyphData.prototype.scale = function (factor) {
        if (!this.points)
            return;
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].x = ((this.points[i].x << 10) * factor) >> 26;
            this.points[i].y = ((this.points[i].y << 10) * factor) >> 26;
        }
        this.leftSideBearing = (this.leftSideBearing * factor) >> 6;
        this.advanceWidth = (this.advanceWidth * factor) >> 6;
    };
    GlyphData.prototype.describe = function (gd) {
        var endPtIndex = 0;
        this.points = [];
        for (var i = 0; i < gd.getPointCount(); i++) {
            var endPt = gd.getEndPtOfContours(endPtIndex) === i;
            if (endPt) {
                endPtIndex++;
            }
            this.points.push(new Point(gd.getXCoordinate(i), gd.getYCoordinate(i), (gd.getFlags(i) & 0x01) !== 0, endPt));
        }
        // Append the origin and advanceWidth points (n & n+1)
        var pointCount = gd.getPointCount();
        this.points.push(new Point(0, 0, true, true));
        this.points.push(new Point(this.advanceWidth, 0, true, true));
    };
    return GlyphData;
}());
export { GlyphData };
