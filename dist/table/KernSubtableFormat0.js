// UNTESTED
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { KerningPair } from './KerningPair.js';
import { KernSubtable } from './KernSubtable.js';
var KernSubtableFormat0 = /** @class */ (function (_super) {
    __extends(KernSubtableFormat0, _super);
    function KernSubtableFormat0(byte_ar) {
        var _this = _super.call(this) || this;
        _this.nPairs = byte_ar.readUnsignedShort();
        _this.searchRange = byte_ar.readUnsignedShort();
        _this.entrySelector = byte_ar.readUnsignedShort();
        _this.rangeShift = byte_ar.readUnsignedShort();
        _this.kerningPairs = Array.from({ length: _this.nPairs }, function () { return new KerningPair(byte_ar); });
        return _this;
    }
    KernSubtableFormat0.prototype.getKerningPairCount = function () {
        return this.nPairs;
    };
    KernSubtableFormat0.prototype.getKerningPair = function (i) {
        var _a;
        return (_a = this.kerningPairs[i]) !== null && _a !== void 0 ? _a : null;
    };
    return KernSubtableFormat0;
}(KernSubtable));
export { KernSubtableFormat0 };
