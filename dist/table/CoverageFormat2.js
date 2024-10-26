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
import { RangeRecord } from './RangeRecord';
var CoverageFormat2 = /** @class */ (function (_super) {
    __extends(CoverageFormat2, _super);
    /** Creates new CoverageFormat2 */
    function CoverageFormat2(byte_ar) {
        var _this = _super.call(this) || this; // Call the parent constructor
        _this.rangeCount = byte_ar.readUnsignedShort();
        _this.rangeRecords = new Array(_this.rangeCount);
        for (var i = 0; i < _this.rangeCount; i++) {
            _this.rangeRecords[i] = new RangeRecord(byte_ar);
        }
        return _this;
    }
    CoverageFormat2.prototype.getFormat = function () {
        return 2;
    };
    CoverageFormat2.prototype.findGlyph = function (glyphId) {
        for (var i = 0; i < this.rangeCount; i++) {
            var n = this.rangeRecords[i].getCoverageIndex(glyphId);
            if (n > -1) {
                return n;
            }
        }
        return -1;
    };
    return CoverageFormat2;
}(Coverage));
export { CoverageFormat2 };
