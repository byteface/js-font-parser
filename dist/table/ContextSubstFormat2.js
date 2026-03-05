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
import { matchInputSequence, nextNonIgnoredIndex } from "./GsubMatch.js";
import { ClassDefReader } from "./ClassDefReader.js";
var ContextSubstFormat2 = /** @class */ (function (_super) {
    __extends(ContextSubstFormat2, _super);
    function ContextSubstFormat2(byte_ar, offset, gsub) {
        var _this = _super.call(this) || this;
        _this.classSets = [];
        _this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            _this.coverage = null;
            _this.classDef = null;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var classDefOffset = byte_ar.readUnsignedShort();
        var classSetCount = byte_ar.readUnsignedShort();
        var classSetOffsets = [];
        for (var i = 0; i < classSetCount; i++)
            classSetOffsets.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + classDefOffset;
        _this.classDef = ClassDefReader.read(byte_ar);
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
            _this.classSets[i] = rules;
        }
        return _this;
    }
    ContextSubstFormat2.prototype.applyToGlyphs = function (glyphs) {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    };
    ContextSubstFormat2.prototype.applyToGlyphsWithContext = function (glyphs, ctx) {
        var _this = this;
        var _a, _b;
        if (!this.coverage || !this.classDef)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i < out.length) {
            i = nextNonIgnoredIndex(out, i, ctx);
            if (i >= out.length)
                break;
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
                var matched = matchInputSequence(out, i, rule.inputClasses, function (expected, gid) { return _this.classDef.getGlyphClass(gid) === expected; }, ctx);
                if (!matched)
                    continue;
                for (var _c = 0, _d = rule.records; _c < _d.length; _c++) {
                    var rec = _d[_c];
                    var targetIndex = (_a = matched[rec.sequenceIndex]) !== null && _a !== void 0 ? _a : (i + rec.sequenceIndex);
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, targetIndex);
                }
                i = ((_b = matched[matched.length - 1]) !== null && _b !== void 0 ? _b : i) + 1;
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
