// UNTESTED
var KerningPair = /** @class */ (function () {
    function KerningPair(byte_ar) {
        this.left = byte_ar.readUnsignedShort();
        this.right = byte_ar.readUnsignedShort();
        this.value = byte_ar.readShort();
    }
    KerningPair.prototype.getLeft = function () {
        return this.left;
    };
    KerningPair.prototype.getRight = function () {
        return this.right;
    };
    KerningPair.prototype.getValue = function () {
        return this.value;
    };
    return KerningPair;
}());
export { KerningPair };
