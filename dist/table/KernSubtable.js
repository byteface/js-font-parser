// UNTESTED
import { Debug } from '../utils/Debug.js';
export class KernSubtable {
    constructor() { }
    getKerningPairCount() {
        return -1;
    }
    getKerningPair(_i) {
        Debug.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return null;
    }
}
