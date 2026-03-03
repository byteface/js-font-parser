// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";
import { Feature } from "./Feature.js";
import { Lookup } from "./Lookup.js";

export class LookupList {
    
    private lookupCount: number;
    private lookupOffsets: number[];
    private lookups: Lookup[];

    constructor(byte_ar: ByteArray, offset: number, factory: any) {
        byte_ar.offset = offset;

        this.lookupCount = byte_ar.readUnsignedShort();
        this.lookupOffsets = new Array(this.lookupCount);
        this.lookups = new Array(this.lookupCount);

        for (let i = 0; i < this.lookupCount; i++) {
            this.lookupOffsets[i] = byte_ar.readUnsignedShort();
        }

        for (let j = 0; j < this.lookupCount; j++) {
            this.lookups[j] = new Lookup(factory, byte_ar, offset + this.lookupOffsets[j]);
        }
    }

    public getLookup(feature: Feature, index: number): Lookup | null {
        if (feature.getLookupCount() > index) {
            const i = feature.getLookupListIndex(index);
            return this.lookups[i] || null;
        }
        return null;
    }

    public getLookups(): Lookup[] {
        return this.lookups;
    }
}
