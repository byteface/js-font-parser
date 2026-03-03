import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var AlternateSubstFormat1 = /** @class */ (function () {
    function AlternateSubstFormat1(byte_ar, offset) {
        this.alternates = [];
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var altSetCount = byte_ar.readUnsignedShort();
        var altSetOffsets = [];
        for (var i = 0; i < altSetCount; i++) {
            altSetOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < altSetOffsets.length; i++) {
            byte_ar.offset = offset + altSetOffsets[i];
            var glyphCount = byte_ar.readUnsignedShort();
            var alts = [];
            for (var j = 0; j < glyphCount; j++) {
                alts.push(byte_ar.readUnsignedShort());
            }
            this.alternates[i] = alts;
        }
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
        return glyphs.map(function (g) { return _this.substitute(g) || g; });
    };
    return AlternateSubstFormat1;
}(LookupSubtable));
export { AlternateSubstFormat1 };
