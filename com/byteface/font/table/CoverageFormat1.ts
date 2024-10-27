// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";
import { ICoverage } from './ICoverage.js';


export class CoverageFormat1 implements ICoverage {
    private glyphCount: number;
    private glyphIds: number[];

    constructor(byte_ar: ByteArray) {
        this.glyphCount = byte_ar.readUnsignedShort();
        this.glyphIds = new Array(this.glyphCount);
        for (let i: number = 0; i < this.glyphCount; i++) {
            this.glyphIds[i] = byte_ar.readUnsignedShort();
        }
    }

    public getFormat(): number {
        return 1;
    }

    public findGlyph(glyphId: number): number {
        for (let i: number = 0; i < this.glyphCount; i++) {
            if (this.glyphIds[i] === glyphId) {
                return i;
            }
        }
        return -1;
    }
}
