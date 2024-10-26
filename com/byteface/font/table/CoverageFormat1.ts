// UNTESTED

import { ByteArray } from "../utils/ByteArray";
import { Coverage } from './Coverage';


export class CoverageFormat1 extends Coverage {
    private glyphCount: number;
    private glyphIds: number[];

    /** Creates new CoverageFormat1 */
    public constructor(byte_ar: ByteArray) {
        super(); // Call the parent constructor
        this.glyphCount = byte_ar.readUnsignedShort();
        this.glyphIds = new Array(this.glyphCount);
        for (let i: number = 0; i < this.glyphCount; i++) {
            this.glyphIds[i] = byte_ar.readUnsignedShort();
        }
    }

    public override getFormat(): number {
        return 1;
    }

    public override findGlyph(glyphId: number): number {
        for (let i: number = 0; i < this.glyphCount; i++) {
            if (this.glyphIds[i] === glyphId) {
                return i;
            }
        }
        return -1;
    }
}
