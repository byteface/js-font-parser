export class GlyfCompositeComp {
    // Constants
    static ARG_1_AND_2_ARE_WORDS = 0x0001;
    static ARGS_ARE_XY_VALUES = 0x0002;
    static ROUND_XY_TO_GRID = 0x0004;
    static WE_HAVE_A_SCALE = 0x0008;
    static MORE_COMPONENTS = 0x0020;
    static WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
    static WE_HAVE_A_TWO_BY_TWO = 0x0080;
    static WE_HAVE_INSTRUCTIONS = 0x0100;
    static USE_MY_METRICS = 0x0200;
    // Properties
    firstIndex = 0;
    firstContour = 0;
    pointCount = 0;
    contourCount = 0;
    argument1 = 0;
    argument2 = 0;
    flags = 0;
    glyphIndex = 0;
    xscale = 1.0;
    yscale = 1.0;
    scale01 = 0.0;
    scale10 = 0.0;
    xtranslate = 0;
    ytranslate = 0;
    point1 = 0;
    point2 = 0;
    constructor(bais) {
        this.flags = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.glyphIndex = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        const argsAreXY = (this.flags & GlyfCompositeComp.ARGS_ARE_XY_VALUES) !== 0;
        const argsAreWords = (this.flags & GlyfCompositeComp.ARG_1_AND_2_ARE_WORDS) !== 0;
        const readSignedByte = () => {
            const v = bais.readByte();
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
            const i = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = this.yscale = i / 0x4000;
        }
        else if ((this.flags & GlyfCompositeComp.WE_HAVE_AN_X_AND_Y_SCALE) !== 0) {
            let j = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = j / 0x4000;
            j = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.yscale = j / 0x4000;
        }
        else if ((this.flags & GlyfCompositeComp.WE_HAVE_A_TWO_BY_TWO) !== 0) {
            let k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.xscale = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.scale01 = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.scale10 = k / 0x4000;
            k = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
            this.yscale = k / 0x4000;
        }
    }
    isArgsAreXY() {
        return (this.flags & GlyfCompositeComp.ARGS_ARE_XY_VALUES) !== 0;
    }
    /**
     * Transforms an x-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed x-coordinate
     */
    scaleX(x, y) {
        return Math.round((x * this.xscale) + (y * this.scale10));
    }
    /**
     * Transforms a y-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed y-coordinate
     */
    scaleY(x, y) {
        return Math.round((x * this.scale01) + (y * this.yscale));
    }
    hasTransform() {
        return this.xscale !== 1 || this.yscale !== 1 || this.scale01 !== 0 || this.scale10 !== 0;
    }
    hasScale() {
        return (this.flags & GlyfCompositeComp.WE_HAVE_A_SCALE) !== 0;
    }
    hasXYScale() {
        return (this.flags & GlyfCompositeComp.WE_HAVE_AN_X_AND_Y_SCALE) !== 0;
    }
    hasTwoByTwo() {
        return (this.flags & GlyfCompositeComp.WE_HAVE_A_TWO_BY_TWO) !== 0;
    }
    getTransformSlotCount() {
        if (this.hasTwoByTwo())
            return 2;
        if (this.hasXYScale())
            return 1;
        if (this.hasScale())
            return 1;
        return 0;
    }
    transformDelta(dx, dy) {
        return {
            dx: (dx * this.xscale) + (dy * this.scale10),
            dy: (dx * this.scale01) + (dy * this.yscale)
        };
    }
}
