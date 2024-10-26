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
var CoverageFormat1 = /** @class */ (function (_super) {
    __extends(CoverageFormat1, _super);
    /** Creates new CoverageFormat1 */
    function CoverageFormat1(byte_ar) {
        var _this = _super.call(this) || this; // Call the parent constructor
        _this.glyphCount = byte_ar.readUnsignedShort();
        _this.glyphIds = new Array(_this.glyphCount);
        for (var i = 0; i < _this.glyphCount; i++) {
            _this.glyphIds[i] = byte_ar.readUnsignedShort();
        }
        return _this;
    }
    CoverageFormat1.prototype.getFormat = function () {
        return 1;
    };
    CoverageFormat1.prototype.findGlyph = function (glyphId) {
        for (var i = 0; i < this.glyphCount; i++) {
            if (this.glyphIds[i] === glyphId) {
                return i;
            }
        }
        return -1;
    };
    return CoverageFormat1;
}(Coverage));
export { CoverageFormat1 };
