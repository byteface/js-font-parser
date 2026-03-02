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
import { BaseArray } from './BaseArray.js';
var MarkBasePosFormat1 = /** @class */ (function (_super) {
    __extends(MarkBasePosFormat1, _super);
    function MarkBasePosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.markCoverage = null;
            _this.baseCoverage = null;
            _this.markClassCount = 0;
            _this.markArray = null;
            _this.baseArray = null;
            byte_ar.offset = prev;
            return _this;
        }
        var markCoverageOffset = byte_ar.readUnsignedShort();
        var baseCoverageOffset = byte_ar.readUnsignedShort();
        _this.markClassCount = byte_ar.readUnsignedShort();
        var markArrayOffset = byte_ar.readUnsignedShort();
        var baseArrayOffset = byte_ar.readUnsignedShort();
        byte_ar.offset = offset + markCoverageOffset;
        _this.markCoverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + baseCoverageOffset;
        _this.baseCoverage = Coverage.read(byte_ar);
        _this.markArray = new MarkArray(byte_ar, offset + markArrayOffset);
        _this.baseArray = new BaseArray(byte_ar, offset + baseArrayOffset, _this.markClassCount);
        byte_ar.offset = prev;
        return _this;
    }
    return MarkBasePosFormat1;
}(LookupSubtable));
export { MarkBasePosFormat1 };
