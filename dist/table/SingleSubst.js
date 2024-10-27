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
import { LookupSubtable } from "./LookupSubtable.js";
import { SingleSubstFormat1 } from "./SingleSubstFormat1.js";
import { SingleSubstFormat2 } from "./SingleSubstFormat2.js";
var SingleSubst = /** @class */ (function (_super) {
    __extends(SingleSubst, _super);
    function SingleSubst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SingleSubst.read = function (byte_ar, offset) {
        var s = null;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format === 1) {
            s = new SingleSubstFormat1(byte_ar, offset);
        }
        else if (format === 2) {
            s = new SingleSubstFormat2(byte_ar, offset);
        }
        return s;
    };
    return SingleSubst;
}(LookupSubtable));
export { SingleSubst };
