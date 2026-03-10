// UNTESTED
import { CoverageFormat1 } from './CoverageFormat1.js';
import { CoverageFormat2 } from './CoverageFormat2.js';
export class Coverage {
    /**
     *
     * @param byte_ar
     * @return
     *
     */
    static read(byte_ar) {
        let c = null;
        const format = byte_ar.readUnsignedShort();
        if (format === 1) {
            c = new CoverageFormat1(byte_ar);
        }
        else if (format === 2) {
            c = new CoverageFormat2(byte_ar);
        }
        return c;
    }
}
