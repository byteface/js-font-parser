import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var ChainingSubstFormat3 = /** @class */ (function () {
    function ChainingSubstFormat3(byte_ar, offset, gsub) {
        this.backtrackCoverages = [];
        this.inputCoverages = [];
        this.lookaheadCoverages = [];
        this.records = [];
        this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            this.backtrackCount = 0;
            this.inputCount = 0;
            this.lookaheadCount = 0;
            return;
        }
        this.backtrackCount = byte_ar.readUnsignedShort();
        var backtrackOffsets = [];
        for (var i = 0; i < this.backtrackCount; i++)
            backtrackOffsets.push(byte_ar.readUnsignedShort());
        this.inputCount = byte_ar.readUnsignedShort();
        var inputOffsets = [];
        for (var i = 0; i < this.inputCount; i++)
            inputOffsets.push(byte_ar.readUnsignedShort());
        this.lookaheadCount = byte_ar.readUnsignedShort();
        var lookaheadOffsets = [];
        for (var i = 0; i < this.lookaheadCount; i++)
            lookaheadOffsets.push(byte_ar.readUnsignedShort());
        var lookupCount = byte_ar.readUnsignedShort();
        for (var i = 0; i < lookupCount; i++) {
            var sequenceIndex = byte_ar.readUnsignedShort();
            var lookupListIndex = byte_ar.readUnsignedShort();
            this.records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
        }
        this.backtrackCoverages = backtrackOffsets.map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        }).filter(function (c) { return !!c; });
        this.inputCoverages = inputOffsets.map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        }).filter(function (c) { return !!c; });
        this.lookaheadCoverages = lookaheadOffsets.map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        }).filter(function (c) { return !!c; });
    }
    ChainingSubstFormat3.prototype.applyToGlyphs = function (glyphs) {
        if (this.inputCount === 0 || this.inputCoverages.length !== this.inputCount)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i <= out.length - this.inputCount) {
            var match = true;
            for (var b = 0; b < this.backtrackCoverages.length; b++) {
                var idx = i - 1 - b;
                if (idx < 0 || this.backtrackCoverages[b].findGlyph(out[idx]) < 0) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                i++;
                continue;
            }
            for (var j = 0; j < this.inputCount; j++) {
                if (this.inputCoverages[j].findGlyph(out[i + j]) < 0) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                i++;
                continue;
            }
            for (var l = 0; l < this.lookaheadCoverages.length; l++) {
                var idx = i + this.inputCount + l;
                if (idx >= out.length || this.lookaheadCoverages[l].findGlyph(out[idx]) < 0) {
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
            i += this.inputCount;
        }
        return out;
    };
    return ChainingSubstFormat3;
}(LookupSubtable));
export { ChainingSubstFormat3 };
