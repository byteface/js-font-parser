// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';

export class KernSubtable {

    constructor() {}

    getKerningPairCount(): number {
        return -1;
    }

    getKerningPair(i: number): KerningPair | null {
        console.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return null;
    }

}
