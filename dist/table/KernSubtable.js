// UNTESTED
var KernSubtable = /** @class */ (function () {
    function KernSubtable() {
    }
    KernSubtable.prototype.getKerningPairCount = function () {
        return -1;
    };
    KernSubtable.prototype.getKerningPair = function (i) {
        console.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return null;
    };
    return KernSubtable;
}());
export { KernSubtable };
