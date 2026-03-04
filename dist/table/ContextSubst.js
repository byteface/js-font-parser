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
import { ContextSubstFormat1 } from "./ContextSubstFormat1.js";
import { ContextSubstFormat2 } from "./ContextSubstFormat2.js";
import { ContextSubstFormat3 } from "./ContextSubstFormat3.js";
var ContextSubst = /** @class */ (function (_super) {
    __extends(ContextSubst, _super);
    function ContextSubst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ContextSubst.read = function (byte_ar, offset, gsub) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1)
            return new ContextSubstFormat1(byte_ar, offset, gsub);
        if (format === 2)
            return new ContextSubstFormat2(byte_ar, offset, gsub);
        if (format === 3)
            return new ContextSubstFormat3(byte_ar, offset, gsub);
        return null;
    };
    return ContextSubst;
}(LookupSubtable));
export { ContextSubst };
