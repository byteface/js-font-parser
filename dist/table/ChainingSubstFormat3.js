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
var ChainingSubstFormat3 = /** @class */ (function (_super) {
    __extends(ChainingSubstFormat3, _super);
    function ChainingSubstFormat3(byte_ar, offset, gsub) {
        var _this = _super.call(this) || this;
        _this.backtrackCoverages = [];
        _this.inputCoverages = [];
        _this.lookaheadCoverages = [];
        _this.records = [];
        _this.gsub = gsub;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            _this.backtrackCount = 0;
            _this.inputCount = 0;
            _this.lookaheadCount = 0;
            return _this;
        }
        _this.backtrackCount = byte_ar.readUnsignedShort();
        var backtrackOffsets = [];
        for (var i = 0; i < _this.backtrackCount; i++)
            backtrackOffsets.push(byte_ar.readUnsignedShort());
        _this.inputCount = byte_ar.readUnsignedShort();
        var inputOffsets = [];
        for (var i = 0; i < _this.inputCount; i++)
            inputOffsets.push(byte_ar.readUnsignedShort());
        _this.lookaheadCount = byte_ar.readUnsignedShort();
        var lookaheadOffsets = [];
        for (var i = 0; i < _this.lookaheadCount; i++)
            lookaheadOffsets.push(byte_ar.readUnsignedShort());
        var lookupCount = byte_ar.readUnsignedShort();
        for (var i = 0; i < lookupCount; i++) {
            var sequenceIndex = byte_ar.readUnsignedShort();
            var lookupListIndex = byte_ar.readUnsignedShort();
            _this.records.push({ sequenceIndex: sequenceIndex, lookupListIndex: lookupListIndex });
        }
        _this.backtrackCoverages = backtrackOffsets
            .map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        })
            .filter(function (c) { return !!c; });
        _this.inputCoverages = inputOffsets
            .map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        })
            .filter(function (c) { return !!c; });
        _this.lookaheadCoverages = lookaheadOffsets
            .map(function (off) {
            byte_ar.offset = offset + off;
            return Coverage.read(byte_ar);
        })
            .filter(function (c) { return !!c; });
        return _this;
    }
    ChainingSubstFormat3.prototype.applyToGlyphs = function (glyphs) {
        if (this.inputCount === 0 || this.inputCoverages.length !== this.inputCount)
            return glyphs;
        var out = glyphs.slice();
        var i = 0;
        while (i <= out.length - this.inputCount) {
            // backtrack
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
            // input
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
            // lookahead
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
