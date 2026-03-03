import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var MultipleSubstFormat1 = /** @class */ (function () {
    function MultipleSubstFormat1(byte_ar, offset) {
        this.sequences = [];
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var sequenceCount = byte_ar.readUnsignedShort();
        var sequenceOffsets = [];
        for (var i = 0; i < sequenceCount; i++) {
            sequenceOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < sequenceOffsets.length; i++) {
            byte_ar.offset = offset + sequenceOffsets[i];
            var glyphCount = byte_ar.readUnsignedShort();
            var seq = [];
            for (var j = 0; j < glyphCount; j++) {
                seq.push(byte_ar.readUnsignedShort());
            }
            this.sequences[i] = seq;
        }
    }
    MultipleSubstFormat1.prototype.substitute = function (glyphId) {
        if (!this.coverage)
            return null;
        var idx = this.coverage.findGlyph(glyphId);
        if (idx < 0)
            return null;
        var seq = this.sequences[idx];
        if (!seq || seq.length === 0)
            return null;
        return seq[0];
    };
    MultipleSubstFormat1.prototype.applyAt = function (glyphs, index) {
        if (!this.coverage)
            return null;
        var gid = glyphs[index];
        var idx = this.coverage.findGlyph(gid);
        if (idx < 0)
            return null;
        var seq = this.sequences[idx];
        if (!seq || seq.length === 0)
            return null;
        return glyphs.slice(0, index).concat(seq, glyphs.slice(index + 1));
    };
    MultipleSubstFormat1.prototype.applyToGlyphs = function (glyphs) {
        if (!this.coverage)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i < out.length) {
            var idx = this.coverage.findGlyph(out[i]);
            if (idx < 0) {
                i++;
                continue;
            }
            var seq = this.sequences[idx];
            if (!seq || seq.length === 0) {
                i++;
                continue;
            }
            out = out.slice(0, i).concat(seq, out.slice(i + 1));
            i += seq.length;
        }
        return out;
    };
    return MultipleSubstFormat1;
}(LookupSubtable));
export { MultipleSubstFormat1 };
