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
var ClassDefFormat2 = /** @class */ (function (_super) {
    __extends(ClassDefFormat2, _super);
    function ClassDefFormat2(byte_ar) {
        var _this = _super.call(this) || this;
        _this.classRangeCount = byte_ar.readUnsignedShort();
        _this.classRangeRecords = new Array(_this.classRangeCount);
        for (var i = 0; i < _this.classRangeCount; i++) {
            var start = byte_ar.readUnsignedShort();
            var end = byte_ar.readUnsignedShort();
            var classValue = byte_ar.readUnsignedShort();
            _this.classRangeRecords[i] = { start: start, end: end, classValue: classValue };
        }
        return _this;
    }
    ClassDefFormat2.prototype.getFormat = function () {
        return 2;
    };
    ClassDefFormat2.prototype.getGlyphClass = function (glyphId) {
        for (var _i = 0, _a = this.classRangeRecords; _i < _a.length; _i++) {
            var record = _a[_i];
            if (glyphId >= record.start && glyphId <= record.end) {
                return record.classValue;
            }
        }
        return 0;
    };
    return ClassDefFormat2;
}(ClassDef));
export { ClassDefFormat2 };
