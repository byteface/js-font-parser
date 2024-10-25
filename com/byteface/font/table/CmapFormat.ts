import { ByteArray } from "../utils/ByteArray.js";

import { CmapFormat0 } from "./CmapFormat0.js";
import { CmapFormat2 } from "./CmapFormat2.js";
import { CmapFormat4 } from "./CmapFormat4.js";
import { CmapFormat6 } from "./CmapFormat6.js";

export class CmapFormat {
    format: number = 0;
    length: number = 0;
    version: number = 0;

    constructor(byte_ar: ByteArray) {
        this.length = byte_ar.readUnsignedShort();
        this.version = byte_ar.readUnsignedShort();
    }

    static create(format: number, byte_ar: ByteArray): CmapFormat | null {
        switch (format) {
            case 0:
                return new CmapFormat0(byte_ar);
            case 2:
                return new CmapFormat2(byte_ar);
            case 4:
                return new CmapFormat4(byte_ar);
            case 6:
                return new CmapFormat6(byte_ar);
            default:
                return null;
        }
    }

    toString(): string {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;		
    }
}
