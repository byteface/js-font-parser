import { ByteArray } from "../utils/ByteArray";

export class Ligature {
    private ligGlyph: number;
    private compCount: number;
    private components: number[];

    constructor(byteAr: ByteArray) {
        this.ligGlyph = byteAr.readUnsignedShort();
        this.compCount = byteAr.readUnsignedShort();
        this.components = new Array(this.compCount - 1);
        for (let i = 0; i < this.compCount - 1; i++) {
            this.components[i] = byteAr.readUnsignedShort();
        }
    }
    
    public getGlyphCount(): number {
        return this.compCount;
    }
    
    public getGlyphId(i: number): number {
        return (i === 0) ? this.ligGlyph : this.components[i - 1];
    }
}
