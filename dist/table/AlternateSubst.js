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
import { LookupSubtable } from "./LookupSubtable.js";
import { AlternateSubstFormat1 } from "./AlternateSubstFormat1.js";
var AlternateSubst = /** @class */ (function (_super) {
    __extends(AlternateSubst, _super);
    function AlternateSubst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AlternateSubst.read = function (byte_ar, offset) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1) {
            return new AlternateSubstFormat1(byte_ar, offset);
        }
        return null;
    };
    return AlternateSubst;
}(LookupSubtable));
export { AlternateSubst };
