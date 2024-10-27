// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { KerningPair } from './KerningPair.js';
import { KernSubtableFormat0 } from './KernSubtableFormat0.js';
import { KernSubtableFormat2 } from './KernSubtableFormat2.js';

export class KernSubtable {

    constructor() {}

    getKerningPairCount(): number {
        return -1;
    }

    getKerningPair(i: number): KerningPair {
        console.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return new KerningPair(new ByteArray());
    }

    static read(byte_ar: ByteArray): KernSubtable | null {
        let table: KernSubtable | null = null;
        // /* const version = */ byte_ar.readUnsignedShort();
        // /* const length  = */ byte_ar.readUnsignedShort();
        const coverage = byte_ar.readUnsignedShort();
        const format = coverage >> 8;

        switch (format) {
            case 0:
                table = new KernSubtableFormat0(byte_ar);
                break;
            case 2:
                table = new KernSubtableFormat2(byte_ar);
                break;
            default:
                console.warn(`Unsupported KernSubtable format: ${format}`);
                break;
        }
        return table;
    }
}
