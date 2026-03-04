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
import { ClassDefReader } from "./ClassDefReader.js";
var ChainingSubstFormat2 = /** @class */ (function (_super) {
    __extends(ChainingSubstFormat2, _super);
    function ChainingSubstFormat2(byte_ar, offset, gsub) {
        var _this = _super.call(this) || this;
        _this.classSets = [];
        _this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            _this.coverage = null;
            _this.backtrackClassDef = null;
            _this.inputClassDef = null;
            _this.lookaheadClassDef = null;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var backClassDefOffset = byte_ar.readUnsignedShort();
        var inputClassDefOffset = byte_ar.readUnsignedShort();
        var lookClassDefOffset = byte_ar.readUnsignedShort();
        var classSetCount = byte_ar.readUnsignedShort();
        var classSetOffsets = [];
        for (var i = 0; i < classSetCount; i++)
            classSetOffsets.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + backClassDefOffset;
        _this.backtrackClassDef = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + inputClassDefOffset;
        _this.inputClassDef = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + lookClassDefOffset;
        _this.lookaheadClassDef = ClassDefReader.read(byte_ar);
        for (var i = 0; i < classSetOffsets.length; i++) {
            var csOffset = classSetOffsets[i];
            if (csOffset === 0) {
                _this.classSets[i] = [];
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
                var backCount = byte_ar.readUnsignedShort();
                var backtrack = [];
                for (var b = 0; b < backCount; b++)
                    backtrack.push(byte_ar.readUnsignedShort());
                var inputCount = byte_ar.readUnsignedShort();
                var input = [];
                for (var g = 0; g < inputCount - 1; g++)
                    input.push(byte_ar.readUnsignedShort());
                var lookCount = byte_ar.readUnsignedShort();
                var lookahead = [];
                for (var l = 0; l < lookCount; l++)
                    lookahead.push(byte_ar.readUnsignedShort());
                var lookupCount = byte_ar.readUnsignedShort();
                var records = [];
                for (var k = 0; k < lookupCount; k++) {
                    var sequenceIndex = byte_ar.readUnsignedShort();
                    var lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
                }
                rules.push({ backtrack: backtrack, input: input, lookahead: lookahead, records: records });
            }
            _this.classSets[i] = rules;
        }
        return _this;
    }
    ChainingSubstFormat2.prototype.applyToGlyphs = function (glyphs) {
        if (!this.coverage || !this.inputClassDef || !this.backtrackClassDef || !this.lookaheadClassDef)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i < out.length) {
            var covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            var classId = this.inputClassDef.getGlyphClass(out[i]);
            var rules = this.classSets[classId] || [];
            var applied = false;
            for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                var rule = rules_1[_i];
                if (i + rule.input.length >= out.length)
                    continue;
                var match = true;
                // backtrack
                for (var b = 0; b < rule.backtrack.length; b++) {
                    var idx = i - 1 - b;
                    var want = rule.backtrack[rule.backtrack.length - 1 - b];
                    if (idx < 0 || this.backtrackClassDef.getGlyphClass(out[idx]) !== want) {
                        match = false;
                        break;
                    }
                }
                if (!match)
                    continue;
                // input
                for (var j = 0; j < rule.input.length; j++) {
                    if (this.inputClassDef.getGlyphClass(out[i + 1 + j]) !== rule.input[j]) {
                        match = false;
                        break;
                    }
                }
                if (!match)
                    continue;
                // lookahead
                for (var l = 0; l < rule.lookahead.length; l++) {
                    var idx = i + 1 + rule.input.length + l;
                    if (idx >= out.length || this.lookaheadClassDef.getGlyphClass(out[idx]) !== rule.lookahead[l]) {
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
    return ChainingSubstFormat2;
}(LookupSubtable));
export { ChainingSubstFormat2 };
