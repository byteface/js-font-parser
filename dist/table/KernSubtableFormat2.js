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
import { KernSubtable } from './KernSubtable.js';
var KernSubtableFormat2 = /** @class */ (function (_super) {
    __extends(KernSubtableFormat2, _super);
    /** Creates new KernSubtableFormat2 */
    function KernSubtableFormat2(byte_ar) {
        var _this = _super.call(this) || this;
        _this.rowWidth = byte_ar.readUnsignedShort();
        _this.leftClassTable = byte_ar.readUnsignedShort();
        _this.rightClassTable = byte_ar.readUnsignedShort();
        _this.array = byte_ar.readUnsignedShort();
        return _this;
    }
    KernSubtableFormat2.prototype.getKerningPairCount = function () {
        return 0;
    };
    KernSubtableFormat2.prototype.getKerningPair = function (i) {
        return null;
    };
    return KernSubtableFormat2;
}(KernSubtable));
export { KernSubtableFormat2 };
