// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { Debug } from '../utils/Debug.js';

export class KernSubtable {

    constructor() {}

    getKerningPairCount(): number {
        return -1;
    }

    getKerningPair(i: number): KerningPair | null {
        Debug.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return null;
    }

}
