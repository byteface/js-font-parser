// UNTESTED
export class Feature {
    featureParams;
    lookupCount;
    lookupListIndex;
    constructor(byte_ar, offset) {
        byte_ar.offset = offset;
        this.featureParams = byte_ar.readUnsignedShort();
        this.lookupCount = byte_ar.readUnsignedShort();
        this.lookupListIndex = new Array(this.lookupCount);
        for (let i = 0; i < this.lookupCount; i++) {
            this.lookupListIndex[i] = byte_ar.readUnsignedShort();
        }
    }
    getLookupCount() {
        return this.lookupCount;
    }
    getLookupListIndex(i) {
        return this.lookupListIndex[i];
    }
}
