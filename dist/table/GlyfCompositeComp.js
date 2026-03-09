var GlyfCompositeComp = /** @class */ (function () {
    function GlyfCompositeComp(bais) {
        // Properties
        this.firstIndex = 0;
        this.firstContour = 0;
        this.pointCount = 0;
        this.contourCount = 0;
        this.argument1 = 0;
        this.argument2 = 0;
        this.flags = 0;
        this.glyphIndex = 0;
        this.xscale = 1.0;
        this.yscale = 1.0;
        this.scale01 = 0.0;
        this.scale10 = 0.0;
        this.xtranslate = 0;
        this.ytranslate = 0;
        this.point1 = 0;
        this.point2 = 0;
        this.flags = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.glyphIndex = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        var argsAreXY = (this.flags & GlyfCompositeComp.ARGS_ARE_XY_VALUES) !== 0;
        var argsAreWords = (this.flags & GlyfCompositeComp.ARG_1_AND_2_ARE_WORDS) !== 0;
        var readSignedByte = function () {
            var v = bais.readByte();
            return v & 0x80 ? v - 0x100 : v;
        };
        // Get the arguments as just their raw values
        if (argsAreWords) {
            this.argument1 = argsAreXY ? bais.readShort() : bais.readUnsignedShort();
            this.argument2 = argsAreXY ? bais.readShort() : bais.readUnsignedShort();
        }
        else {
            this.argument1 = argsAreXY ? readSignedByte() : bais.readUnsignedByte();
            this.argument2 = argsAreXY ? readSignedByte() : bais.readUnsignedByte();
        }
        // Assign the arguments according to the flags
        if ((this.flags & GlyfCompositeComp.ARGS_ARE_XY_VALUES) !== 0) {
            this.xtranslate = this.argument1;
            this.ytranslate = this.argument2;
        }
        else {
            this.point1 = this.argument1;
            this.point2 = this.argument2;
        }
        // Get the scale values (if any)
        if ((this.flags & GlyfCompositeComp.WE_HAVE_A_SCALE) !== 0) {
            var i = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = this.yscale = i / 0x4000;
        }
        else if ((this.flags & GlyfCompositeComp.WE_HAVE_AN_X_AND_Y_SCALE) !== 0) {
            var j = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = j / 0x4000;
            j = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.yscale = j / 0x4000;
        }
        else if ((this.flags & GlyfCompositeComp.WE_HAVE_A_TWO_BY_TWO) !== 0) {
            var k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.scale01 = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.scale10 = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.yscale = k / 0x4000;
        }
    }
    GlyfCompositeComp.prototype.isArgsAreXY = function () {
        return (this.flags & GlyfCompositeComp.ARGS_ARE_XY_VALUES) !== 0;
    };
    /**
     * Transforms an x-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed x-coordinate
     */
    GlyfCompositeComp.prototype.scaleX = function (x, y) {
        return Math.round((x * this.xscale) + (y * this.scale10));
    };
    /**
     * Transforms a y-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed y-coordinate
     */
    GlyfCompositeComp.prototype.scaleY = function (x, y) {
        return Math.round((x * this.scale01) + (y * this.yscale));
    };
    GlyfCompositeComp.prototype.hasTransform = function () {
        return this.xscale !== 1 || this.yscale !== 1 || this.scale01 !== 0 || this.scale10 !== 0;
    };
    GlyfCompositeComp.prototype.hasScale = function () {
        return (this.flags & GlyfCompositeComp.WE_HAVE_A_SCALE) !== 0;
    };
    GlyfCompositeComp.prototype.hasXYScale = function () {
        return (this.flags & GlyfCompositeComp.WE_HAVE_AN_X_AND_Y_SCALE) !== 0;
    };
    GlyfCompositeComp.prototype.hasTwoByTwo = function () {
        return (this.flags & GlyfCompositeComp.WE_HAVE_A_TWO_BY_TWO) !== 0;
    };
    GlyfCompositeComp.prototype.getTransformSlotCount = function () {
        if (this.hasTwoByTwo())
            return 2;
        if (this.hasXYScale())
            return 1;
        if (this.hasScale())
            return 1;
        return 0;
    };
    GlyfCompositeComp.prototype.transformDelta = function (dx, dy) {
        return {
            dx: (dx * this.xscale) + (dy * this.scale10),
            dy: (dx * this.scale01) + (dy * this.yscale)
        };
    };
    // Constants
    GlyfCompositeComp.ARG_1_AND_2_ARE_WORDS = 0x0001;
    GlyfCompositeComp.ARGS_ARE_XY_VALUES = 0x0002;
    GlyfCompositeComp.ROUND_XY_TO_GRID = 0x0004;
    GlyfCompositeComp.WE_HAVE_A_SCALE = 0x0008;
    GlyfCompositeComp.MORE_COMPONENTS = 0x0020;
    GlyfCompositeComp.WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
    GlyfCompositeComp.WE_HAVE_A_TWO_BY_TWO = 0x0080;
    GlyfCompositeComp.WE_HAVE_INSTRUCTIONS = 0x0100;
    GlyfCompositeComp.USE_MY_METRICS = 0x0200;
    return GlyfCompositeComp;
}());
export { GlyfCompositeComp };
