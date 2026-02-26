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
import { ClassDef } from "./ClassDef.js";
import { RangeRecord } from "./RangeRecord.js";
var ClassDefFormat2 = /** @class */ (function (_super) {
    __extends(ClassDefFormat2, _super);
    function ClassDefFormat2(byte_ar) {
        var _this = _super.call(this) || this;
        _this.classRangeCount = byte_ar.readUnsignedShort();
        _this.classRangeRecords = new Array(_this.classRangeCount);
        for (var i = 0; i < _this.classRangeCount; i++) {
            _this.classRangeRecords[i] = new RangeRecord(byte_ar);
        }
        return _this;
    }
    ClassDefFormat2.prototype.getFormat = function () {
        return 2;
    };
    return ClassDefFormat2;
}(ClassDef));
export { ClassDefFormat2 };
