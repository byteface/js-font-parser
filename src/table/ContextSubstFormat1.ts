import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";

export class ContextSubstFormat1 extends LookupSubtable {
    private coverage: ICoverage | null;
    private ruleSets: Array<Array<{ input: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }>> = [];
    private gsub: GsubTable;

    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable) {
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
        const ruleSetOffsets: number[] = [];
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
            const ruleOffsets: number[] = [];
            for (let r = 0; r < ruleCount; r++) ruleOffsets.push(byte_ar.readUnsignedShort());
            const rules: Array<{ input: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }> = [];
            for (const ro of ruleOffsets) {
                byte_ar.offset = offset + rsOffset + ro;
                const glyphCount = byte_ar.readUnsignedShort();
                const lookupCount = byte_ar.readUnsignedShort();
                const input: number[] = [];
                for (let g = 0; g < glyphCount - 1; g++) input.push(byte_ar.readUnsignedShort());
                const records: Array<{ sequenceIndex: number; lookupListIndex: number }> = [];
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

    applyToGlyphs(glyphs: number[]): number[] {
        if (!this.coverage) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            const covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            const rules = this.ruleSets[covIndex] || [];
            let applied = false;
            for (const rule of rules) {
                if (i + rule.input.length >= out.length) continue;
                let match = true;
                for (let j = 0; j < rule.input.length; j++) {
                    if (out[i + 1 + j] !== rule.input[j]) {
                        match = false;
                        break;
                    }
                }
                if (!match) continue;
                for (const rec of rule.records) {
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, i + rec.sequenceIndex);
                }
                i += rule.input.length + 1;
                applied = true;
                break;
            }
            if (!applied) i++;
        }
        return out;
    }
}
