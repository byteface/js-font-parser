import { ByteArray } from "../utils/ByteArray.js";
import { GlyfCompositeComp } from './GlyfCompositeComp.js'

export class GlyfCompositeDescript {
    instructions: number[] | null = null;

    static onCurve = 0x01;
    static xShortVector = 0x02;
    static yShortVector = 0x04;
    static repeat = 0x08;
    static xDual = 0x10;
    static yDual = 0x20;

    parentTable: any;
    numberOfContours: number = 0;
    xMin: number = 0;
    yMin: number = 0;
    xMax: number = 0;
    yMax: number = 0;

    components: GlyfCompositeComp[] = [];
    beingResolved: boolean = false;
    resolved: boolean = false;

    constructor(parentTable: any, bais: ByteArray) {
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

        for (const comp of this.components) {
            comp.firstIndex = firstIndex;
            comp.firstContour = firstContour;

            const desc = this.parentTable.getDescription(comp.glyphIndex);
            if (desc != null) {
                desc.resolve();
                firstIndex += desc.count;
                firstContour += desc.numberOfContours;
            }
        }

        this.resolved = true;
        this.beingResolved = false;
    }

    getEndPtOfContours(i: number): number {
        const c = this.getCompositeCompEndPt(i);
        if (c != null) {
            const gd = this.parentTable.getDescription(c.glyphIndex);
            return gd.getEndPtOfContours(i - c.firstContour) + c.firstIndex;
        }
        return 0;
    }

    getFlags(i: number): number {
        const c = this.getCompositeComp(i);
        if (c != null) {
            const gd = this.parentTable.description(c.glyphIndex);
            return gd.getFlags(i - c.firstIndex);
        }
        return 0;
    }

    getXCoordinate(i: number): number {
        const c = this.getCompositeComp(i);
        if (c != null) {
            const gd = this.parentTable.description(c.glyphIndex);
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
            const n = i - c.firstIndex;
            const x = gd.getXCoordinate(n);
            const y = gd.getYCoordinate(n);
            const y1 = c.scaleY(x, y);
            return y1 + c.ytranslate;
        }
        return 0;
    }

    private getCompositeComp(i: number): GlyfCompositeComp | null {
        return this.components.find(comp => comp.firstIndex === i) || null;
    }

    private getCompositeCompEndPt(i: number): GlyfCompositeComp | null {
        return this.components.find(comp => comp.firstContour === i) || null;
    }

    getInstructions(): number[] | null {
        return this.instructions;
    }
}
