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
import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';
var SinglePosFormat1 = /** @class */ (function (_super) {
    __extends(SinglePosFormat1, _super);
    function SinglePosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            _this.valueFormat = 0;
            _this.value = null;
            byte_ar.offset = prev;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        _this.valueFormat = byte_ar.readUnsignedShort();
        _this.value = ValueRecord.read(byte_ar, _this.valueFormat);
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = prev;
        return _this;
    }
    SinglePosFormat1.prototype.getAdjustment = function (glyphId) {
        if (!this.coverage)
            return null;
        var idx = this.coverage.findGlyph(glyphId);
        if (idx < 0)
            return null;
        return this.value;
    };
    return SinglePosFormat1;
}(LookupSubtable));
export { SinglePosFormat1 };
