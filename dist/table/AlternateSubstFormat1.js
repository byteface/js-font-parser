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
var AlternateSubstFormat1 = /** @class */ (function (_super) {
    __extends(AlternateSubstFormat1, _super);
    function AlternateSubstFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.alternates = [];
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var altSetCount = byte_ar.readUnsignedShort();
        var altSetOffsets = [];
        for (var i = 0; i < altSetCount; i++) {
            altSetOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < altSetOffsets.length; i++) {
            byte_ar.offset = offset + altSetOffsets[i];
            var glyphCount = byte_ar.readUnsignedShort();
            var alts = [];
            for (var j = 0; j < glyphCount; j++) {
                alts.push(byte_ar.readUnsignedShort());
            }
            _this.alternates[i] = alts;
        }
        return _this;
    }
    AlternateSubstFormat1.prototype.substitute = function (glyphId) {
        if (!this.coverage)
            return null;
        var idx = this.coverage.findGlyph(glyphId);
        if (idx < 0)
            return null;
        var alts = this.alternates[idx];
        if (!alts || alts.length === 0)
            return null;
        return alts[0];
    };
    AlternateSubstFormat1.prototype.applyAt = function (glyphs, index) {
        var gid = glyphs[index];
        var sub = this.substitute(gid);
        if (sub == null)
            return null;
        var out = glyphs.slice();
        out[index] = sub;
        return out;
    };
    AlternateSubstFormat1.prototype.applyToGlyphs = function (glyphs) {
        var _this = this;
        if (!this.coverage)
            return glyphs;
        return glyphs.map(function (g) { var _a; return (_a = _this.substitute(g)) !== null && _a !== void 0 ? _a : g; });
    };
    return AlternateSubstFormat1;
}(LookupSubtable));
export { AlternateSubstFormat1 };
