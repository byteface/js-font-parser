import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { ClassDefReader } from "./ClassDefReader.js";
var ContextSubstFormat2 = /** @class */ (function () {
    function ContextSubstFormat2(byte_ar, offset, gsub) {
        this.classSets = [];
        this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.classDef = null;
            return;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var classDefOffset = byte_ar.readUnsignedShort();
        var classSetCount = byte_ar.readUnsignedShort();
        var classSetOffsets = [];
        for (var i = 0; i < classSetCount; i++)
            classSetOffsets.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + classDefOffset;
        this.classDef = ClassDefReader.read(byte_ar);
        for (var i = 0; i < classSetOffsets.length; i++) {
            var csOffset = classSetOffsets[i];
            if (csOffset === 0) {
                this.classSets[i] = [];
                continue;
            }
            byte_ar.offset = offset + csOffset;
            var ruleCount = byte_ar.readUnsignedShort();
            var ruleOffsets = [];
            for (var r = 0; r < ruleCount; r++)
                ruleOffsets.push(byte_ar.readUnsignedShort());
            var rules = [];
            for (var _i = 0, ruleOffsets_1 = ruleOffsets; _i < ruleOffsets_1.length; _i++) {
                var ro = ruleOffsets_1[_i];
                byte_ar.offset = offset + csOffset + ro;
                var glyphCount = byte_ar.readUnsignedShort();
                var lookupCount = byte_ar.readUnsignedShort();
                var inputClasses = [];
                for (var g = 0; g < glyphCount - 1; g++)
                    inputClasses.push(byte_ar.readUnsignedShort());
                var records = [];
                for (var l = 0; l < lookupCount; l++) {
                    var sequenceIndex = byte_ar.readUnsignedShort();
                    var lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
                }
                rules.push({ inputClasses: inputClasses, records: records });
            }
            this.classSets[i] = rules;
        }
    }
    ContextSubstFormat2.prototype.applyToGlyphs = function (glyphs) {
        if (!this.coverage || !this.classDef)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i < out.length) {
            var covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            var classId = this.classDef.getGlyphClass(out[i]);
            var rules = this.classSets[classId] || [];
            var applied = false;
            for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                var rule = rules_1[_i];
                if (i + rule.inputClasses.length >= out.length)
                    continue;
                var match = true;
                for (var j = 0; j < rule.inputClasses.length; j++) {
                    var cls = this.classDef.getGlyphClass(out[i + 1 + j]);
                    if (cls !== rule.inputClasses[j]) {
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
                i += rule.inputClasses.length + 1;
                applied = true;
                break;
            }
            if (!applied)
                i++;
        }
        return out;
    };
    return ContextSubstFormat2;
}(LookupSubtable));
export { ContextSubstFormat2 };
