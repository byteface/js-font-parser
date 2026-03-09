import { ByteArray } from "../utils/ByteArray.js";
import { GlyfCompositeComp } from './GlyfCompositeComp.js'
import { IGlyphDescription } from "./IGlyphDescription.js";

type GlyfParentTable = {
    getDescription: (index: number) => IGlyphDescription | null;
};

export class GlyfCompositeDescript implements IGlyphDescription {
    instructions: number[] | null = null;

    static onCurve = 0x01;
    static xShortVector = 0x02;
    static yShortVector = 0x04;
    static repeat = 0x08;
    static xDual = 0x10;
    static yDual = 0x20;

    parentTable: GlyfParentTable;
    numberOfContours: number = 0;
    xMin: number = 0;
    yMin: number = 0;
    xMax: number = 0;
    yMax: number = 0;

    components: GlyfCompositeComp[] = [];
    beingResolved: boolean = false;
    resolved: boolean = false;
    private pointCount: number = 0;
    private contourCount: number = 0;

    constructor(parentTable: GlyfParentTable, bais: ByteArray) {
        this.parentTable = parentTable;
        this.init(bais);
    }

    private init(bais: ByteArray) {
        this.numberOfContours = -1;

        this.xMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.xMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();

        let comp: GlyfCompositeComp;
        do {
            comp = new GlyfCompositeComp(bais);
            this.components.push(comp);
        } while ((comp.flags & GlyfCompositeComp.MORE_COMPONENTS) !== 0);

        // Are there hinting instructions to read?
        if ((comp.flags & GlyfCompositeComp.WE_HAVE_INSTRUCTIONS) !== 0) {
            this.readInstructions(bais, (bais.readUnsignedByte() << 8 | bais.readUnsignedByte()));
        }
    }

    private readInstructions(byte_ar: ByteArray, count: number) {
        this.instructions = [];
        for (let i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    }

    resolve() {
        if (this.resolved) return;
        if (this.beingResolved) {
            // alert("Circular reference in GlyfCompositeDesc");
            return;
        }
        this.beingResolved = true;

        let firstIndex = 0;
        let firstContour = 0;

        const getCompositePoint = (pointIndex: number, beforeComp: GlyfCompositeComp | null): { x: number; y: number } | null => {
            for (const c of this.components) {
                if (beforeComp && c === beforeComp) break;
                if (pointIndex < c.firstIndex || pointIndex >= c.firstIndex + c.pointCount) {
                    continue;
                }
                const desc = this.parentTable.getDescription(c.glyphIndex);
                if (!desc) return null;
                const localIndex = pointIndex - c.firstIndex;
                const x = desc.getXCoordinate(localIndex);
                const y = desc.getYCoordinate(localIndex);
                return {
                    x: c.scaleX(x, y) + c.xtranslate,
                    y: c.scaleY(x, y) + c.ytranslate
                };
            }
            return null;
        };

        for (const comp of this.components) {
            comp.firstIndex = firstIndex;
            comp.firstContour = firstContour;

            const desc = this.parentTable.getDescription(comp.glyphIndex);
            if (desc != null) {
                desc.resolve();
                comp.pointCount = desc.getPointCount();
                comp.contourCount = desc.getContourCount();
                if (!comp.isArgsAreXY()) {
                    const parentPoint = getCompositePoint(comp.point1, comp);
                    if (parentPoint) {
                        const cx = desc.getXCoordinate(comp.point2);
                        const cy = desc.getYCoordinate(comp.point2);
                        const scaledX = comp.scaleX(cx, cy);
                        const scaledY = comp.scaleY(cx, cy);
                        comp.xtranslate = parentPoint.x - scaledX;
                        comp.ytranslate = parentPoint.y - scaledY;
                    }
                }
                firstIndex += comp.pointCount;
                firstContour += comp.contourCount;
            }
        }

        this.pointCount = firstIndex;
        this.contourCount = firstContour;
        this.resolved = true;
        this.beingResolved = false;
    }

    getEndPtOfContours(i: number): number {
        const c = this.getCompositeCompEndPt(i);
        if (c != null) {
            const gd = this.parentTable.getDescription(c.glyphIndex);
            if (gd == null) {
                return 0;
            }
            return gd.getEndPtOfContours(i - c.firstContour) + c.firstIndex;
        }
        return 0;
    }

    getFlags(i: number): number {
        const c = this.getCompositeComp(i);
        if (c != null) {
            const gd = this.parentTable.getDescription(c.glyphIndex);
            if (gd == null) {
                return 0;
            }
            return gd.getFlags(i - c.firstIndex);
        }
        return 0;
    }

    getXCoordinate(i: number): number {
        const c = this.getCompositeComp(i);
        if (c != null) {
            const gd = this.parentTable.getDescription(c.glyphIndex);
            if (gd == null) {
                return 0;
            }
            const n = i - c.firstIndex;
            const x = gd.getXCoordinate(n);
            const y = gd.getYCoordinate(n);
            const x1 = c.scaleX(x, y);
            return x1 + c.xtranslate;
        }
        return 0;
    }

    getYCoordinate(i: number): number {
        const c = this.getCompositeComp(i);
        if (c != null) {
            const gd = this.parentTable.getDescription(c.glyphIndex);
            if (gd == null) {
                return 0;
            }
            const n = i - c.firstIndex;
            const x = gd.getXCoordinate(n);
            const y = gd.getYCoordinate(n);
            const y1 = c.scaleY(x, y);
            return y1 + c.ytranslate;
        }
        return 0;
    }

    public getComponentForPointIndex(i: number): GlyfCompositeComp | null {
        return this.getCompositeComp(i);
    }

    private getCompositeComp(i: number): GlyfCompositeComp | null {
        if (!Array.isArray(this.components)) return null;
        return this.components.find(comp => i >= comp.firstIndex && i < comp.firstIndex + comp.pointCount) || null;
    }

    private getCompositeCompEndPt(i: number): GlyfCompositeComp | null {
        if (!Array.isArray(this.components)) return null;
        return this.components.find(comp => i >= comp.firstContour && i < comp.firstContour + comp.contourCount) || null;
    }

    getInstructions(): number[] | null {
        return this.instructions;
    }

    isComposite(): boolean {
        return true;
    }

    getPointCount(): number {
        return this.pointCount;
    }

    getContourCount(): number {
        return this.contourCount;
    }

    getComponentCount(): number {
        return Array.isArray(this.components) ? this.components.length : 0;
    }

    getXMaximum(): number {
        return this.xMax;
    }
    getXMinimum(): number {
        return this.xMin;
    }
    getYMaximum(): number {
        return this.yMax;
    }
    getYMinimum(): number {
        return this.yMin;
    }
}
