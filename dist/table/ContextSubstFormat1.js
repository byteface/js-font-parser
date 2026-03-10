import { Coverage } from "./Coverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { matchInputSequence, nextNonIgnoredIndex } from "./GsubMatch.js";
export class ContextSubstFormat1 extends LookupSubtable {
    coverage;
    ruleSets = [];
    gsub;
    constructor(byte_ar, offset, gsub) {
        super();
        this.gsub = gsub;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const ruleSetCount = byte_ar.readUnsignedShort();
        const ruleSetOffsets = [];
        for (let i = 0; i < ruleSetCount; i++) {
            ruleSetOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        for (let i = 0; i < ruleSetOffsets.length; i++) {
            const rsOffset = ruleSetOffsets[i];
            if (rsOffset === 0) {
                this.ruleSets[i] = [];
                continue;
            }
            byte_ar.offset = offset + rsOffset;
            const ruleCount = byte_ar.readUnsignedShort();
            const ruleOffsets = [];
            for (let r = 0; r < ruleCount; r++)
                ruleOffsets.push(byte_ar.readUnsignedShort());
            const rules = [];
            for (const ro of ruleOffsets) {
                byte_ar.offset = offset + rsOffset + ro;
                const glyphCount = byte_ar.readUnsignedShort();
                const lookupCount = byte_ar.readUnsignedShort();
                const input = [];
                for (let g = 0; g < glyphCount - 1; g++)
                    input.push(byte_ar.readUnsignedShort());
                const records = [];
                for (let l = 0; l < lookupCount; l++) {
                    const sequenceIndex = byte_ar.readUnsignedShort();
                    const lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex, lookupListIndex });
                }
                rules.push({ input, records });
            }
            this.ruleSets[i] = rules;
        }
    }
    applyToGlyphs(glyphs) {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    }
    applyToGlyphsWithContext(glyphs, ctx) {
        if (!this.coverage)
            return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            i = nextNonIgnoredIndex(out, i, ctx);
            if (i >= out.length)
                break;
            const covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            const rules = this.ruleSets[covIndex] || [];
            let applied = false;
            for (const rule of rules) {
                const matched = matchInputSequence(out, i, rule.input, (expected, gid) => gid === expected, ctx);
                if (!matched)
                    continue;
                for (const rec of rule.records) {
                    const targetIndex = matched[rec.sequenceIndex] ?? (i + rec.sequenceIndex);
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, targetIndex);
                }
                i = (matched[matched.length - 1] ?? i) + 1;
                applied = true;
                break;
            }
            if (!applied)
                i++;
        }
        return out;
    }
}
