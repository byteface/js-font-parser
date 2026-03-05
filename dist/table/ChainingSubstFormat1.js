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
import { matchBacktrackSequence, matchInputSequence, matchLookaheadSequence, nextNonIgnoredIndex } from "./GsubMatch.js";
var ChainingSubstFormat1 = /** @class */ (function (_super) {
    __extends(ChainingSubstFormat1, _super);
    function ChainingSubstFormat1(byte_ar, offset, gsub) {
        var _this = _super.call(this) || this;
        _this.ruleSets = [];
        _this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var ruleSetCount = byte_ar.readUnsignedShort();
        var ruleSetOffsets = [];
        for (var i = 0; i < ruleSetCount; i++)
            ruleSetOffsets.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < ruleSetOffsets.length; i++) {
            var rsOffset = ruleSetOffsets[i];
            if (rsOffset === 0) {
                _this.ruleSets[i] = [];
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
            _this.ruleSets[i] = rules;
        }
        return _this;
    }
    ChainingSubstFormat1.prototype.applyToGlyphs = function (glyphs) {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    };
    ChainingSubstFormat1.prototype.applyToGlyphsWithContext = function (glyphs, ctx) {
        var _a, _b, _c;
        if (!this.coverage)
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
            var rules = this.ruleSets[covIndex] || [];
            var applied = false;
            for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                var rule = rules_1[_i];
                if (!matchBacktrackSequence(out, i, rule.backtrack, function (expected, gid) { return gid === expected; }, ctx))
                    continue;
                var matched = matchInputSequence(out, i, rule.input, function (expected, gid) { return gid === expected; }, ctx);
                if (!matched)
                    continue;
                var lookStart = (_a = matched[matched.length - 1]) !== null && _a !== void 0 ? _a : i;
                if (!matchLookaheadSequence(out, lookStart, rule.lookahead, function (expected, gid) { return gid === expected; }, ctx))
                    continue;
                for (var _d = 0, _e = rule.records; _d < _e.length; _d++) {
                    var rec = _e[_d];
                    var targetIndex = (_b = matched[rec.sequenceIndex]) !== null && _b !== void 0 ? _b : (i + rec.sequenceIndex);
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, targetIndex);
                }
                i = ((_c = matched[matched.length - 1]) !== null && _c !== void 0 ? _c : i) + 1;
                applied = true;
                break;
            }
            if (!applied)
                i++;
        }
        return out;
    };
    return ChainingSubstFormat1;
}(LookupSubtable));
export { ChainingSubstFormat1 };
