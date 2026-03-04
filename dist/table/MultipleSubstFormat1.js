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
var MultipleSubstFormat1 = /** @class */ (function (_super) {
    __extends(MultipleSubstFormat1, _super);
    function MultipleSubstFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.sequences = [];
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var sequenceCount = byte_ar.readUnsignedShort();
        var sequenceOffsets = [];
        for (var i = 0; i < sequenceCount; i++) {
            sequenceOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        for (var i = 0; i < sequenceOffsets.length; i++) {
            byte_ar.offset = offset + sequenceOffsets[i];
            var glyphCount = byte_ar.readUnsignedShort();
            var seq = [];
            for (var j = 0; j < glyphCount; j++) {
                seq.push(byte_ar.readUnsignedShort());
            }
            _this.sequences[i] = seq;
        }
        return _this;
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
