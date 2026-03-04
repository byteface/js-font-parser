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
import { ClassDefReader } from './ClassDefReader.js';
import { LookupSubtable } from './LookupSubtable.js';
import { ValueRecord } from './ValueRecord.js';
var PairPosFormat2 = /** @class */ (function (_super) {
    __extends(PairPosFormat2, _super);
    function PairPosFormat2(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.classRecords = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            _this.coverage = null;
            _this.valueFormat1 = 0;
            _this.valueFormat2 = 0;
            _this.classDef1 = null;
            _this.classDef2 = null;
            _this.class1Count = 0;
            _this.class2Count = 0;
            byte_ar.offset = prev;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        _this.valueFormat1 = byte_ar.readUnsignedShort();
        _this.valueFormat2 = byte_ar.readUnsignedShort();
        var classDef1Offset = byte_ar.readUnsignedShort();
        var classDef2Offset = byte_ar.readUnsignedShort();
        _this.class1Count = byte_ar.readUnsignedShort();
        _this.class2Count = byte_ar.readUnsignedShort();
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + classDef1Offset;
        _this.classDef1 = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + classDef2Offset;
        _this.classDef2 = ClassDefReader.read(byte_ar);
        _this.classRecords = [];
        for (var i = 0; i < _this.class1Count; i++) {
            var row = [];
            for (var j = 0; j < _this.class2Count; j++) {
                var v1 = ValueRecord.read(byte_ar, _this.valueFormat1);
                var v2 = ValueRecord.read(byte_ar, _this.valueFormat2);
                row.push({ v1: v1, v2: v2 });
            }
            _this.classRecords.push(row);
        }
        byte_ar.offset = prev;
        return _this;
    }
    PairPosFormat2.prototype.getKerning = function (leftGlyph, rightGlyph) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!this.coverage || !this.classDef1 || !this.classDef2)
            return 0;
        var index = this.coverage.findGlyph(leftGlyph);
        if (index < 0)
            return 0;
        var c1 = (_c = (_b = (_a = this.classDef1).getGlyphClass) === null || _b === void 0 ? void 0 : _b.call(_a, leftGlyph)) !== null && _c !== void 0 ? _c : 0;
        var c2 = (_f = (_e = (_d = this.classDef2).getGlyphClass) === null || _e === void 0 ? void 0 : _e.call(_d, rightGlyph)) !== null && _f !== void 0 ? _f : 0;
        if (c1 < 0 || c2 < 0 || c1 >= this.classRecords.length || c2 >= this.classRecords[c1].length)
            return 0;
        return (_j = (_h = (_g = this.classRecords[c1][c2]) === null || _g === void 0 ? void 0 : _g.v1) === null || _h === void 0 ? void 0 : _h.xAdvance) !== null && _j !== void 0 ? _j : 0;
    };
    PairPosFormat2.prototype.getPairValue = function (leftGlyph, rightGlyph) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!this.coverage || !this.classDef1 || !this.classDef2)
            return null;
        var index = this.coverage.findGlyph(leftGlyph);
        if (index < 0)
            return null;
        var c1 = (_c = (_b = (_a = this.classDef1).getGlyphClass) === null || _b === void 0 ? void 0 : _b.call(_a, leftGlyph)) !== null && _c !== void 0 ? _c : 0;
        var c2 = (_f = (_e = (_d = this.classDef2).getGlyphClass) === null || _e === void 0 ? void 0 : _e.call(_d, rightGlyph)) !== null && _f !== void 0 ? _f : 0;
        if (c1 < 0 || c2 < 0 || c1 >= this.classRecords.length || c2 >= this.classRecords[c1].length)
            return null;
        return (_g = this.classRecords[c1][c2]) !== null && _g !== void 0 ? _g : null;
    };
    return PairPosFormat2;
}(LookupSubtable));
export { PairPosFormat2 };
