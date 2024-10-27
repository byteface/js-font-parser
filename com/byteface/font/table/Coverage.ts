// UNTESTED

// TODO - where is this used? 
// as we changed the implmentation to have the coverageformat classes implement an interface

import { ByteArray } from '../utils/ByteArray.js';
import { CoverageFormat1 } from './CoverageFormat1.js';
import { CoverageFormat2 } from './CoverageFormat2.js';
import { ICoverage } from './ICoverage.js';


export class Coverage {


    /**
     * 
     * @param byte_ar
     * @return 
     * 
     */
    public static read(byte_ar: ByteArray): ICoverage | null {
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
