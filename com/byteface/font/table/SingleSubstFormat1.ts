// UNTESTED

import { ByteArray } from '../utils/ByteArray';
import { Coverage } from './Coverage';
import { SingleSubst } from './SingleSubst';

export class SingleSubstFormat1 extends SingleSubst {
    
    private coverageOffset: number;
    private deltaGlyphID: number;
    private coverage: Coverage | null;

    public constructor(byte_ar: ByteArray, offset: number) {
        super(); // Call the constructor of the parent class
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.deltaGlyphID = byte_ar.readShort();
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }

    public override getFormat(): number {
        return 1;
    }

    public override substitute(glyphId: number): number {
        if (this.coverage) {
            const i: number = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return glyphId + this.deltaGlyphID;
            }
        }
        return glyphId;
    }
    
}
