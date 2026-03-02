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
import { MarkArray } from './MarkArray.js';
import { Mark2Array } from './Mark2Array.js';
var MarkMarkPosFormat1 = /** @class */ (function (_super) {
    __extends(MarkMarkPosFormat1, _super);
    function MarkMarkPosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.mark1Coverage = null;
            _this.mark2Coverage = null;
            _this.markClassCount = 0;
            _this.mark1Array = null;
            _this.mark2Array = null;
            byte_ar.offset = prev;
            return _this;
        }
        var mark1CoverageOffset = byte_ar.readUnsignedShort();
        var mark2CoverageOffset = byte_ar.readUnsignedShort();
        _this.markClassCount = byte_ar.readUnsignedShort();
        var mark1ArrayOffset = byte_ar.readUnsignedShort();
        var mark2ArrayOffset = byte_ar.readUnsignedShort();
        byte_ar.offset = offset + mark1CoverageOffset;
        _this.mark1Coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + mark2CoverageOffset;
        _this.mark2Coverage = Coverage.read(byte_ar);
        _this.mark1Array = new MarkArray(byte_ar, offset + mark1ArrayOffset);
        _this.mark2Array = new Mark2Array(byte_ar, offset + mark2ArrayOffset, _this.markClassCount);
        byte_ar.offset = prev;
        return _this;
    }
    return MarkMarkPosFormat1;
}(LookupSubtable));
export { MarkMarkPosFormat1 };
