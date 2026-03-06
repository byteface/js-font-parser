import { GlyfCompositeComp } from './GlyfCompositeComp.js';
var GlyfCompositeDescript = /** @class */ (function () {
    function GlyfCompositeDescript(parentTable, bais) {
        this.instructions = null;
        this.numberOfContours = 0;
        this.xMin = 0;
        this.yMin = 0;
        this.xMax = 0;
        this.yMax = 0;
        this.components = [];
        this.beingResolved = false;
        this.resolved = false;
        this.pointCount = 0;
        this.contourCount = 0;
        this.parentTable = parentTable;
        this.init(bais);
    }
    GlyfCompositeDescript.prototype.init = function (bais) {
        this.numberOfContours = -1;
        this.xMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.xMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        var comp;
        do {
            comp = new GlyfCompositeComp(bais);
            this.components.push(comp);
        } while ((comp.flags & GlyfCompositeComp.MORE_COMPONENTS) !== 0);
        // Are there hinting instructions to read?
        if ((comp.flags & GlyfCompositeComp.WE_HAVE_INSTRUCTIONS) !== 0) {
            this.readInstructions(bais, (bais.readUnsignedByte() << 8 | bais.readUnsignedByte()));
        }
    };
    GlyfCompositeDescript.prototype.readInstructions = function (byte_ar, count) {
        this.instructions = [];
        for (var i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    };
    GlyfCompositeDescript.prototype.resolve = function () {
        if (this.resolved)
            return;
        if (this.beingResolved) {
            // alert("Circular reference in GlyfCompositeDesc");
            return;
        }
        this.beingResolved = true;
        var firstIndex = 0;
        var firstContour = 0;
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var comp = _a[_i];
            comp.firstIndex = firstIndex;
            comp.firstContour = firstContour;
            var desc = this.parentTable.getDescription(comp.glyphIndex);
            if (desc != null) {
                desc.resolve();
                comp.pointCount = desc.getPointCount();
                comp.contourCount = desc.getContourCount();
                firstIndex += comp.pointCount;
                firstContour += comp.contourCount;
            }
        }
        this.pointCount = firstIndex;
        this.contourCount = firstContour;
        this.resolved = true;
        this.beingResolved = false;
    };
    GlyfCompositeDescript.prototype.getEndPtOfContours = function (i) {
        var c = this.getCompositeCompEndPt(i);
        if (c != null) {
            var gd = this.parentTable.getDescription(c.glyphIndex);
            return gd.getEndPtOfContours(i - c.firstContour) + c.firstIndex;
        }
        return 0;
    };
    GlyfCompositeDescript.prototype.getFlags = function (i) {
        var c = this.getCompositeComp(i);
        if (c != null) {
            var gd = this.parentTable.getDescription(c.glyphIndex);
            return gd.getFlags(i - c.firstIndex);
        }
        return 0;
    };
    GlyfCompositeDescript.prototype.getXCoordinate = function (i) {
        var c = this.getCompositeComp(i);
        if (c != null) {
            var gd = this.parentTable.getDescription(c.glyphIndex);
            var n = i - c.firstIndex;
            var x = gd.getXCoordinate(n);
            var y = gd.getYCoordinate(n);
            var x1 = c.scaleX(x, y);
            return x1 + c.xtranslate;
        }
        return 0;
    };
    GlyfCompositeDescript.prototype.getYCoordinate = function (i) {
        var c = this.getCompositeComp(i);
        if (c != null) {
            var gd = this.parentTable.getDescription(c.glyphIndex);
            var n = i - c.firstIndex;
            var x = gd.getXCoordinate(n);
            var y = gd.getYCoordinate(n);
            var y1 = c.scaleY(x, y);
            return y1 + c.ytranslate;
        }
        return 0;
    };
    GlyfCompositeDescript.prototype.getComponentForPointIndex = function (i) {
        return this.getCompositeComp(i);
    };
    GlyfCompositeDescript.prototype.getCompositeComp = function (i) {
        return this.components.find(function (comp) { return i >= comp.firstIndex && i < comp.firstIndex + comp.pointCount; }) || null;
    };
    GlyfCompositeDescript.prototype.getCompositeCompEndPt = function (i) {
        return this.components.find(function (comp) { return i >= comp.firstContour && i < comp.firstContour + comp.contourCount; }) || null;
    };
    GlyfCompositeDescript.prototype.getInstructions = function () {
        return this.instructions;
    };
    GlyfCompositeDescript.prototype.isComposite = function () {
        return true;
    };
    GlyfCompositeDescript.prototype.getPointCount = function () {
        return this.pointCount;
    };
    GlyfCompositeDescript.prototype.getContourCount = function () {
        return this.contourCount;
    };
    GlyfCompositeDescript.prototype.getXMaximum = function () {
        return this.xMax;
    };
    GlyfCompositeDescript.prototype.getXMinimum = function () {
        return this.xMin;
    };
    GlyfCompositeDescript.prototype.getYMaximum = function () {
        return this.yMax;
    };
    GlyfCompositeDescript.prototype.getYMinimum = function () {
        return this.yMin;
    };
    GlyfCompositeDescript.onCurve = 0x01;
    GlyfCompositeDescript.xShortVector = 0x02;
    GlyfCompositeDescript.yShortVector = 0x04;
    GlyfCompositeDescript.repeat = 0x08;
    GlyfCompositeDescript.xDual = 0x10;
    GlyfCompositeDescript.yDual = 0x20;
    return GlyfCompositeDescript;
}());
export { GlyfCompositeDescript };
