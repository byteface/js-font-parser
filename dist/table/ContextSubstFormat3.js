import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var ContextSubstFormat3 = /** @class */ (function () {
    function ContextSubstFormat3(byte_ar, offset, gsub) {
        var _this = this;
        this.coverages = [];
        this.records = [];
        this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            this.glyphCount = 0;
            this.lookupCount = 0;
            return;
        }
        this.glyphCount = byte_ar.readUnsignedShort();
        this.lookupCount = byte_ar.readUnsignedShort();
        var coverageOffsets = [];
        for (var i = 0; i < this.glyphCount; i++) {
            coverageOffsets.push(byte_ar.readUnsignedShort());
        }
        for (var i = 0; i < this.lookupCount; i++) {
            var sequenceIndex = byte_ar.readUnsignedShort();
            var lookupListIndex = byte_ar.readUnsignedShort();
            this.records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
        }
        this.coverages = coverageOffsets.map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        }).filter(function (c) { return !!c; });
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
