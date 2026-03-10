// UNTESTED
import { Lookup } from "./Lookup.js";
export class LookupList {
    lookupCount;
    lookupOffsets;
    lookups;
    constructor(byte_ar, offset, factory) {
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
    getLookup(feature, index) {
        if (feature.getLookupCount() > index) {
            const i = feature.getLookupListIndex(index);
            return this.lookups[i] || null;
        }
        return null;
    }
    getLookups() {
        return this.lookups;
    }
}
