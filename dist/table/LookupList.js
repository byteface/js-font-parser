// UNTESTED
import { Lookup } from "./Lookup.js";
var LookupList = /** @class */ (function () {
    function LookupList(byte_ar, offset, factory) {
        byte_ar.offset = offset;
        this.lookupCount = byte_ar.readUnsignedShort();
        this.lookupOffsets = new Array(this.lookupCount);
        this.lookups = new Array(this.lookupCount);
        for (var i = 0; i < this.lookupCount; i++) {
            this.lookupOffsets[i] = byte_ar.readUnsignedShort();
        }
        for (var j = 0; j < this.lookupCount; j++) {
            this.lookups[j] = new Lookup(factory, byte_ar, offset + this.lookupOffsets[j]);
        }
    }
    LookupList.prototype.getLookup = function (feature, index) {
        if (feature.getLookupCount() > index) {
            var i = feature.getLookupListIndex(index);
            return this.lookups[i] || null;
        }
        return null;
    };
    LookupList.prototype.getLookups = function () {
        return this.lookups;
    };
    return LookupList;
}());
export { LookupList };
