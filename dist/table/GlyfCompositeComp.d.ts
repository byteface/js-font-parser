import { ByteArray } from "../utils/ByteArray.js";
export declare class GlyfCompositeComp {
    static readonly ARG_1_AND_2_ARE_WORDS = 1;
    static readonly ARGS_ARE_XY_VALUES = 2;
    static readonly ROUND_XY_TO_GRID = 4;
    static readonly WE_HAVE_A_SCALE = 8;
    static readonly MORE_COMPONENTS = 32;
    static readonly WE_HAVE_AN_X_AND_Y_SCALE = 64;
    static readonly WE_HAVE_A_TWO_BY_TWO = 128;
    static readonly WE_HAVE_INSTRUCTIONS = 256;
    static readonly USE_MY_METRICS = 512;
    firstIndex: number;
    firstContour: number;
    pointCount: number;
    contourCount: number;
    argument1: number;
    argument2: number;
    flags: number;
    glyphIndex: number;
    xscale: number;
    yscale: number;
    scale01: number;
    scale10: number;
    xtranslate: number;
    ytranslate: number;
    point1: number;
    point2: number;
    constructor(bais: ByteArray);
    isArgsAreXY(): boolean;
    /**
     * Transforms an x-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed x-coordinate
     */
    scaleX(x: number, y: number): number;
    /**
     * Transforms a y-coordinate of a point for this component.
     * @param x The x-coordinate of the point to transform
     * @param y The y-coordinate of the point to transform
     * @return The transformed y-coordinate
     */
    scaleY(x: number, y: number): number;
    hasTransform(): boolean;
    hasScale(): boolean;
    hasXYScale(): boolean;
    hasTwoByTwo(): boolean;
    getTransformSlotCount(): number;
    transformDelta(dx: number, dy: number): {
        dx: number;
        dy: number;
    };
}
