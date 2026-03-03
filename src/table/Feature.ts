// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";

export class Feature {
    private featureParams: number;
    private lookupCount: number;
    private lookupListIndex: number[];

    constructor(byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;
        this.featureParams = byte_ar.readUnsignedShort();
        this.lookupCount = byte_ar.readUnsignedShort();
        this.lookupListIndex = new Array<number>(this.lookupCount);
        
        for (let i = 0; i < this.lookupCount; i++) {
            this.lookupListIndex[i] = byte_ar.readUnsignedShort();
        }
    }

    public getLookupCount(): number {
        return this.lookupCount;
    }

    public getLookupListIndex(i: number): number {
        return this.lookupListIndex[i];
    }
}
