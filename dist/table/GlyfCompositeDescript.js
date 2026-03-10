import { GlyfCompositeComp } from './GlyfCompositeComp.js';
export class GlyfCompositeDescript {
    instructions = null;
    static onCurve = 0x01;
    static xShortVector = 0x02;
    static yShortVector = 0x04;
    static repeat = 0x08;
    static xDual = 0x10;
    static yDual = 0x20;
    parentTable;
    numberOfContours = 0;
    xMin = 0;
    yMin = 0;
    xMax = 0;
    yMax = 0;
    components = [];
    beingResolved = false;
    resolved = false;
    pointCount = 0;
    contourCount = 0;
    constructor(parentTable, bais) {
        this.parentTable = parentTable;
        this.init(bais);
    }
    init(bais) {
        this.numberOfContours = -1;
        this.xMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMin = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.xMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        this.yMax = (bais.readUnsignedByte() << 8) | bais.readUnsignedByte();
        let comp;
        do {
            comp = new GlyfCompositeComp(bais);
            this.components.push(comp);
        } while ((comp.flags & GlyfCompositeComp.MORE_COMPONENTS) !== 0);
        // Are there hinting instructions to read?
        if ((comp.flags & GlyfCompositeComp.WE_HAVE_INSTRUCTIONS) !== 0) {
            this.readInstructions(bais, (bais.readUnsignedByte() << 8 | bais.readUnsignedByte()));
        }
    }
    readInstructions(byte_ar, count) {
        this.instructions = [];
        for (let i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    }
    resolve() {
        if (this.resolved)
            return;
        if (this.beingResolved) {
            // alert("Circular reference in GlyfCompositeDesc");
            return;
        }
        this.beingResolved = true;
        let firstIndex = 0;
        let firstContour = 0;
        const getCompositePoint = (pointIndex, beforeComp) => {
            for (const c of this.components) {
                if (beforeComp && c === beforeComp)
                    break;
                if (pointIndex < c.firstIndex || pointIndex >= c.firstIndex + c.pointCount) {
                    continue;
                }
                const desc = this.parentTable.getDescription(c.glyphIndex);
                if (!desc)
                    return null;
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
    getEndPtOfContours(i) {
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
    getFlags(i) {
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
    getXCoordinate(i) {
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
    getYCoordinate(i) {
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
    getComponentForPointIndex(i) {
        return this.getCompositeComp(i);
    }
    getCompositeComp(i) {
        if (!Array.isArray(this.components))
            return null;
        return this.components.find(comp => i >= comp.firstIndex && i < comp.firstIndex + comp.pointCount) || null;
    }
    getCompositeCompEndPt(i) {
        if (!Array.isArray(this.components))
            return null;
        return this.components.find(comp => i >= comp.firstContour && i < comp.firstContour + comp.contourCount) || null;
    }
    getInstructions() {
        return this.instructions;
    }
    isComposite() {
        return true;
    }
    getPointCount() {
        return this.pointCount;
    }
    getContourCount() {
        return this.contourCount;
    }
    getComponentCount() {
        return Array.isArray(this.components) ? this.components.length : 0;
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
}
