// UNTESTED

import { ByteArray } from '../utils/ByteArray';
import { CoverageFormat1 } from './CoverageFormat1';
import { CoverageFormat2 } from './CoverageFormat2';


export class Coverage {
    
    public getFormat(): number {
        return -1;
    }

    /**
     * @param glyphId The ID of the glyph to find.
     * @return The index of the glyph within the coverage, or -1 if the glyph
     * can't be found.
     */
    public findGlyph(glyphId: number): number {
        return -1;
    }

    /**
     * 
     * @param byte_ar
     * @return 
     * 
     */
    public static read(byte_ar: ByteArray): Coverage | null {
        let c: Coverage | null = null;
        const format: number = byte_ar.readUnsignedShort();
        if (format === 1) {
            c = new CoverageFormat1(byte_ar);
        } else if (format === 2) {
            c = new CoverageFormat2(byte_ar);
        }
        return c;
    }
}
