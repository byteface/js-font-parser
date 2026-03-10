import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
export declare class Coverage {
    /**
     *
     * @param byte_ar
     * @return
     *
     */
    static read(byte_ar: ByteArray): ICoverage | null;
}
