import { ByteArray } from "../utils/ByteArray.js";
import { ClassDef } from "./ClassDef.js";

export class ClassDefFormat1 extends ClassDef {
    private startGlyph: number;
    private glyphCount: number;
    private classValues: number[];

    constructor(byte_ar: ByteArray) {
        super();
        this.startGlyph = byte_ar.readUnsignedShort();
        this.glyphCount = byte_ar.readUnsignedShort();
        this.classValues = new Array(this.glyphCount);

        for (let i = 0; i < this.glyphCount; i++) {
            this.classValues[i] = byte_ar.readUnsignedShort();
        }
    }

    public override getFormat(): number {
        return 1;
    }
}
