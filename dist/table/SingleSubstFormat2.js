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
import { Coverage } from './Coverage';
import { SingleSubst } from './SingleSubst';
var SingleSubstFormat2 = /** @class */ (function (_super) {
    __extends(SingleSubstFormat2, _super);
    function SingleSubstFormat2(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.coverageOffset = byte_ar.readUnsignedShort();
        _this.glyphCount = byte_ar.readUnsignedShort();
        _this.substitutes = new Array(_this.glyphCount);
        for (var i = 0; i < _this.glyphCount; i++) {
            _this.substitutes[i] = byte_ar.readUnsignedShort();
        }
        byte_ar.offset = offset + _this.coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        return _this;
    }
    SingleSubstFormat2.prototype.getFormat = function () {
        return 2;
    };
    SingleSubstFormat2.prototype.substitute = function (glyphId) {
        if (this.coverage) {
            var i = this.coverage.findGlyph(glyphId);
            if (i > -1) {
                return this.substitutes[i];
            }
        }
        return glyphId;
    };
    return SingleSubstFormat2;
}(SingleSubst));
export { SingleSubstFormat2 };
