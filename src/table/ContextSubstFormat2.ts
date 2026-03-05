import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
import { GsubMatchContext, matchInputSequence } from "./GsubMatch.js";
import { ClassDefReader } from "./ClassDefReader.js";
import { ClassDef } from "./ClassDef.js";

export class ContextSubstFormat2 extends LookupSubtable {
    private coverage: ICoverage | null;
    private classDef: ClassDef | null;
    private classSets: Array<Array<{ inputClasses: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }>> = [];
    private gsub: GsubTable;

    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable) {
        super();
        this.gsub = gsub;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.classDef = null;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const classDefOffset = byte_ar.readUnsignedShort();
        const classSetCount = byte_ar.readUnsignedShort();
        const classSetOffsets: number[] = [];
        for (let i = 0; i < classSetCount; i++) classSetOffsets.push(byte_ar.readUnsignedShort());

        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + classDefOffset;
        this.classDef = ClassDefReader.read(byte_ar);

        for (let i = 0; i < classSetOffsets.length; i++) {
            const csOffset = classSetOffsets[i];
            if (csOffset === 0) {
                this.classSets[i] = [];
                continue;
            }
            byte_ar.offset = offset + csOffset;
            const ruleCount = byte_ar.readUnsignedShort();
            const ruleOffsets: number[] = [];
            for (let r = 0; r < ruleCount; r++) ruleOffsets.push(byte_ar.readUnsignedShort());
            const rules: Array<{ inputClasses: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }> = [];
            for (const ro of ruleOffsets) {
                byte_ar.offset = offset + csOffset + ro;
                const glyphCount = byte_ar.readUnsignedShort();
                const lookupCount = byte_ar.readUnsignedShort();
                const inputClasses: number[] = [];
                for (let g = 0; g < glyphCount - 1; g++) inputClasses.push(byte_ar.readUnsignedShort());
                const records: Array<{ sequenceIndex: number; lookupListIndex: number }> = [];
                for (let l = 0; l < lookupCount; l++) {
                    const sequenceIndex = byte_ar.readUnsignedShort();
                    const lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex, lookupListIndex });
                }
                rules.push({ inputClasses, records });
            }
            this.classSets[i] = rules;
        }
    }

    applyToGlyphs(glyphs: number[]): number[] {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    }

    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[] {
        if (!this.coverage || !this.classDef) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            const covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            const classId = this.classDef.getGlyphClass(out[i]);
            const rules = this.classSets[classId] || [];
            let applied = false;
            for (const rule of rules) {
                const matched = matchInputSequence(out, i, rule.inputClasses, (expected, gid) => this.classDef!.getGlyphClass(gid) === expected, ctx);
                if (!matched) continue;
                for (const rec of rule.records) {
                    const targetIndex = matched[rec.sequenceIndex] ?? (i + rec.sequenceIndex);
                    out = this.gsub.applyLookupAt(rec.lookupListIndex, out, targetIndex);
                }
                i = (matched[matched.length - 1] ?? i) + 1;
                applied = true;
                break;
            }
            if (!applied) i++;
        }
        return out;
    }
}
