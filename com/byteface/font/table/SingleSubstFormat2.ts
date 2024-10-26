// UNTESTED

import { ByteArray } from '../utils/ByteArray';
import { Coverage } from './Coverage';
import { SingleSubst } from './SingleSubst';

export class SingleSubstFormat2 extends SingleSubst {
    
    private coverageOffset: number;
    private glyphCount: number;
    private substitutes: number[];
    private coverage: Coverage | null;

    public constructor(byte_ar: ByteArray, offset: number) {
        super();
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.glyphCount = byte_ar.readUnsignedShort();
        this.substitutes = new Array(this.glyphCount);
        for (let i: number = 0; i < this.glyphCount; i++) {
            this.substitutes[i] = byte_ar.readUnsignedShort();
        }
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }

    public override getFormat(): number {
        return 2;
    }

    public override substitute(glyphId: number): number {
        if(this.coverage){
            const i: number = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return this.substitutes[i];
            }
        }
        return glyphId;
    }
}
