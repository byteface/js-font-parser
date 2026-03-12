import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { matchBacktrackSequence, matchLookaheadSequence, nextNonIgnoredIndex } from "./GsubMatch.js";
export class ReverseChainSingleSubst extends LookupSubtable {
    coverage = null;
    backtrackCoverages = [];
    lookaheadCoverages = [];
    substitutes = [];
    constructor(byte_ar, offset) {
        super();
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1)
            return;
        const coverageOffset = byte_ar.readUnsignedShort();
        const backtrackGlyphCount = byte_ar.readUnsignedShort();
        const backtrackOffsets = [];
        for (let i = 0; i < backtrackGlyphCount; i++)
            backtrackOffsets.push(byte_ar.readUnsignedShort());
        const lookaheadGlyphCount = byte_ar.readUnsignedShort();
        const lookaheadOffsets = [];
        for (let i = 0; i < lookaheadGlyphCount; i++)
            lookaheadOffsets.push(byte_ar.readUnsignedShort());
        const glyphCount = byte_ar.readUnsignedShort();
        for (let i = 0; i < glyphCount; i++)
            this.substitutes.push(byte_ar.readUnsignedShort());
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        this.backtrackCoverages = backtrackOffsets.map((entryOffset) => {
            byte_ar.offset = offset + entryOffset;
            return Coverage.read(byte_ar);
        }).filter((coverage) => !!coverage);
        this.lookaheadCoverages = lookaheadOffsets.map((entryOffset) => {
            byte_ar.offset = offset + entryOffset;
            return Coverage.read(byte_ar);
        }).filter((coverage) => !!coverage);
    }
    applyToGlyphs(glyphs) {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    }
    applyToGlyphsWithContext(glyphs, ctx) {
        if (!this.coverage)
            return glyphs;
        const out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            i = nextNonIgnoredIndex(out, i, ctx);
            if (i >= out.length)
                break;
            const coverageIndex = this.coverage.findGlyph(out[i]);
            if (coverageIndex < 0) {
                i++;
                continue;
            }
            const backtrackOk = matchBacktrackSequence(out, i, this.backtrackCoverages, (expected, glyphId) => expected.findGlyph(glyphId) >= 0, ctx);
            if (!backtrackOk) {
                i++;
                continue;
            }
            const lookaheadOk = matchLookaheadSequence(out, i, this.lookaheadCoverages, (expected, glyphId) => expected.findGlyph(glyphId) >= 0, ctx);
            if (!lookaheadOk) {
                i++;
                continue;
            }
            const substitute = this.substitutes[coverageIndex];
            if (substitute != null && substitute !== 0) {
                out[i] = substitute;
            }
            i++;
        }
        return out;
    }
}
