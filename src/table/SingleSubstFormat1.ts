// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { Coverage } from './Coverage.js';
// import { SingleSubst } from './SingleSubst.js';
import { ISingleSubst } from './ISingleSubst.js';

export class SingleSubstFormat1 implements ISingleSubst {
    
    private coverageOffset: number;
    private deltaGlyphID: number;
    private coverage: ICoverage | null;

    public constructor(byte_ar: ByteArray, offset: number) {
        this.coverageOffset = byte_ar.readUnsignedShort();
        this.deltaGlyphID = byte_ar.readShort();
        byte_ar.offset = offset + this.coverageOffset;
        this.coverage = Coverage.read(byte_ar);
    }

    public getFormat(): number {
        return 1;
    }

    public substitute(glyphId: number): number {
        if (this.coverage) {
            const i: number = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return glyphId + this.deltaGlyphID;
            }
        }
        return glyphId;
    }
    
}
