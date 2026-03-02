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
var PairPosFormat1 = /** @class */ (function (_super) {
    __extends(PairPosFormat1, _super);
    function PairPosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.pairSets = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            _this.valueFormat1 = 0;
            _this.valueFormat2 = 0;
            byte_ar.offset = prev;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        _this.valueFormat1 = byte_ar.readUnsignedShort();
        _this.valueFormat2 = byte_ar.readUnsignedShort();
        var pairSetCount = byte_ar.readUnsignedShort();
        var pairSetOffsets = [];
        for (var i = 0; i < pairSetCount; i++) {
            pairSetOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        _this.pairSets = pairSetOffsets.map(function (pairOffset) {
            var _a;
            var map = new Map();
            byte_ar.offset = offset + pairOffset;
            var pairValueCount = byte_ar.readUnsignedShort();
            for (var i = 0; i < pairValueCount; i++) {
                var secondGlyph = byte_ar.readUnsignedShort();
                var v1 = ValueRecord.read(byte_ar, _this.valueFormat1);
                ValueRecord.read(byte_ar, _this.valueFormat2);
                var adjust = (_a = v1.xAdvance) !== null && _a !== void 0 ? _a : 0;
                map.set(secondGlyph, adjust);
            }
            return map;
        });
        byte_ar.offset = prev;
        return _this;
    }
    PairPosFormat1.prototype.getKerning = function (leftGlyph, rightGlyph) {
        var _a;
        if (!this.coverage)
            return 0;
        var index = this.coverage.findGlyph(leftGlyph);
        if (index < 0 || index >= this.pairSets.length)
            return 0;
        var map = this.pairSets[index];
        return (_a = map.get(rightGlyph)) !== null && _a !== void 0 ? _a : 0;
    };
    return PairPosFormat1;
}(LookupSubtable));
export { PairPosFormat1 };
