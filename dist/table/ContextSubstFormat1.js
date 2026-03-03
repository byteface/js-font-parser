import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
var ContextSubstFormat1 = /** @class */ (function () {
    function ContextSubstFormat1(byte_ar, offset, gsub) {
        this.ruleSets = [];
        this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var ruleSetCount = byte_ar.readUnsignedShort();
        var ruleSetOffsets = [];
        for (var i = 0; i < ruleSetCount; i++)
            ruleSetOffsets.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < ruleSetOffsets.length; i++) {
            var rsOffset = ruleSetOffsets[i];
            if (rsOffset === 0) {
                this.ruleSets[i] = [];
                continue;
            }
            byte_ar.offset = offset + rsOffset;
            var ruleCount = byte_ar.readUnsignedShort();
            var ruleOffsets = [];
            for (var r = 0; r < ruleCount; r++)
                ruleOffsets.push(byte_ar.readUnsignedShort());
            var rules = [];
            for (var _i = 0, ruleOffsets_1 = ruleOffsets; _i < ruleOffsets_1.length; _i++) {
                var ro = ruleOffsets_1[_i];
                byte_ar.offset = offset + rsOffset + ro;
                var glyphCount = byte_ar.readUnsignedShort();
                var lookupCount = byte_ar.readUnsignedShort();
                var input = [];
                for (var g = 0; g < glyphCount - 1; g++)
                    input.push(byte_ar.readUnsignedShort());
                var records = [];
                for (var l = 0; l < lookupCount; l++) {
                    var sequenceIndex = byte_ar.readUnsignedShort();
                    var lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
                }
                rules.push({ input: input, records: records });
            }
            this.ruleSets[i] = rules;
        }
    }
    ContextSubstFormat1.prototype.applyToGlyphs = function (glyphs) {
        if (!this.coverage)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i < out.length) {
            var covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            var rules = this.ruleSets[covIndex] || [];
            var applied = false;
            for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                var rule = rules_1[_i];
                if (i + rule.input.length >= out.length)
                    continue;
                var match = true;
                for (var j = 0; j < rule.input.length; j++) {
                    if (out[i + 1 + j] !== rule.input[j]) {
                        match = false;
                        break;
                    }
                }
                if (!match)
                    continue;
                for (var _a = 0, _b = rule.records; _a < _b.length; _a++) {
                    var rec = _b[_a];
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, i + rec.sequenceIndex);
                }
                i += rule.input.length + 1;
                applied = true;
                break;
            }
            if (!applied)
                i++;
        }
        return out;
    };
    return ContextSubstFormat1;
}(LookupSubtable));
export { ContextSubstFormat1 };
