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
var ClassDefFormat1 = /** @class */ (function (_super) {
    __extends(ClassDefFormat1, _super);
    function ClassDefFormat1(byte_ar) {
        var _this = _super.call(this) || this;
        _this.startGlyph = byte_ar.readUnsignedShort();
        _this.glyphCount = byte_ar.readUnsignedShort();
        _this.classValues = new Array(_this.glyphCount);
        for (var i = 0; i < _this.glyphCount; i++) {
            _this.classValues[i] = byte_ar.readUnsignedShort();
        }
        return _this;
    }
    ClassDefFormat1.prototype.getFormat = function () {
        return 1;
    };
    return ClassDefFormat1;
}(ClassDef));
export { ClassDefFormat1 };
