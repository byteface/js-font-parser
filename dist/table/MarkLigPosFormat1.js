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
import { LigatureArray } from './LigatureArray.js';
var MarkLigPosFormat1 = /** @class */ (function (_super) {
    __extends(MarkLigPosFormat1, _super);
    function MarkLigPosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.markCoverage = null;
            _this.ligatureCoverage = null;
            _this.markClassCount = 0;
            _this.markArray = null;
            _this.ligatureArray = null;
            byte_ar.offset = prev;
            return _this;
        }
        var markCoverageOffset = byte_ar.readUnsignedShort();
        var ligCoverageOffset = byte_ar.readUnsignedShort();
        _this.markClassCount = byte_ar.readUnsignedShort();
        var markArrayOffset = byte_ar.readUnsignedShort();
        var ligArrayOffset = byte_ar.readUnsignedShort();
        byte_ar.offset = offset + markCoverageOffset;
        _this.markCoverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + ligCoverageOffset;
        _this.ligatureCoverage = Coverage.read(byte_ar);
        _this.markArray = new MarkArray(byte_ar, offset + markArrayOffset);
        _this.ligatureArray = new LigatureArray(byte_ar, offset + ligArrayOffset, _this.markClassCount);
        byte_ar.offset = prev;
        return _this;
    }
    return MarkLigPosFormat1;
}(LookupSubtable));
export { MarkLigPosFormat1 };
