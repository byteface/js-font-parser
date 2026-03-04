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
import { ChainingSubstFormat1 } from "./ChainingSubstFormat1.js";
import { ChainingSubstFormat2 } from "./ChainingSubstFormat2.js";
import { ChainingSubstFormat3 } from "./ChainingSubstFormat3.js";
var ChainingSubst = /** @class */ (function (_super) {
    __extends(ChainingSubst, _super);
    function ChainingSubst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChainingSubst.read = function (byte_ar, offset, gsub) {
        var format = byte_ar.dataView.getUint16(offset);
        if (format === 1)
            return new ChainingSubstFormat1(byte_ar, offset, gsub);
        if (format === 2)
            return new ChainingSubstFormat2(byte_ar, offset, gsub);
        if (format === 3)
            return new ChainingSubstFormat3(byte_ar, offset, gsub);
        return null;
    };
    return ChainingSubst;
}(LookupSubtable));
export { ChainingSubst };
