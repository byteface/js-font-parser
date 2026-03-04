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
import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var ContextSubstFormat3 = /** @class */ (function (_super) {
    __extends(ContextSubstFormat3, _super);
    function ContextSubstFormat3(byte_ar, offset, gsub) {
        var _this = _super.call(this) || this;
        _this.coverages = [];
        _this.records = [];
        _this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            _this.glyphCount = 0;
            _this.lookupCount = 0;
            return _this;
        }
        _this.glyphCount = byte_ar.readUnsignedShort();
        _this.lookupCount = byte_ar.readUnsignedShort();
        var coverageOffsets = [];
        for (var i = 0; i < _this.glyphCount; i++) {
            coverageOffsets.push(byte_ar.readUnsignedShort());
        }
        for (var i = 0; i < _this.lookupCount; i++) {
            var sequenceIndex = byte_ar.readUnsignedShort();
            var lookupListIndex = byte_ar.readUnsignedShort();
            _this.records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
        }
        _this.coverages = coverageOffsets
            .map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        })
            .filter(function (c) { return !!c; });
        return _this;
    }
    ContextSubstFormat3.prototype.applyToGlyphs = function (glyphs) {
        if (this.glyphCount === 0 || this.coverages.length !== this.glyphCount)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i <= out.length - this.glyphCount) {
            var match = true;
            for (var j = 0; j < this.glyphCount; j++) {
                var cov = this.coverages[j];
                if (!cov || cov.findGlyph(out[i + j]) < 0) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                i++;
                continue;
            }
            for (var _i = 0, _a = this.records; _i < _a.length; _i++) {
                var rec = _a[_i];
                out = this.gsub.applyLookupAt(rec.lookupListIndex, out, i + rec.sequenceIndex);
            }
            i += this.glyphCount;
        }
        return out;
    };
    return ContextSubstFormat3;
}(LookupSubtable));
export { ContextSubstFormat3 };
