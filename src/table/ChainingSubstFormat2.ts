import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
import { GsubMatchContext, matchBacktrackSequence, matchInputSequence, matchLookaheadSequence } from "./GsubMatch.js";
import { ClassDefReader } from "./ClassDefReader.js";
import { ClassDef } from "./ClassDef.js";

export class ChainingSubstFormat2 extends LookupSubtable {
    private coverage: ICoverage | null;
    private backtrackClassDef: ClassDef | null;
    private inputClassDef: ClassDef | null;
    private lookaheadClassDef: ClassDef | null;
    private classSets: Array<Array<{ backtrack: number[]; input: number[]; lookahead: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }>> = [];
    private gsub: GsubTable;

    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable) {
        super();
        this.gsub = gsub;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 2) {
            this.coverage = null;
            this.backtrackClassDef = null;
            this.inputClassDef = null;
            this.lookaheadClassDef = null;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const backClassDefOffset = byte_ar.readUnsignedShort();
        const inputClassDefOffset = byte_ar.readUnsignedShort();
        const lookClassDefOffset = byte_ar.readUnsignedShort();
        const classSetCount = byte_ar.readUnsignedShort();
        const classSetOffsets: number[] = [];
        for (let i = 0; i < classSetCount; i++) classSetOffsets.push(byte_ar.readUnsignedShort());

        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + backClassDefOffset;
        this.backtrackClassDef = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + inputClassDefOffset;
        this.inputClassDef = ClassDefReader.read(byte_ar);
        byte_ar.offset = offset + lookClassDefOffset;
        this.lookaheadClassDef = ClassDefReader.read(byte_ar);

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
            const rules: Array<{ backtrack: number[]; input: number[]; lookahead: number[]; records: Array<{ sequenceIndex: number; lookupListIndex: number }> }> = [];
            for (const ro of ruleOffsets) {
                byte_ar.offset = offset + csOffset + ro;
                const backCount = byte_ar.readUnsignedShort();
                const backtrack: number[] = [];
                for (let b = 0; b < backCount; b++) backtrack.push(byte_ar.readUnsignedShort());

                const inputCount = byte_ar.readUnsignedShort();
                const input: number[] = [];
                for (let g = 0; g < inputCount - 1; g++) input.push(byte_ar.readUnsignedShort());

                const lookCount = byte_ar.readUnsignedShort();
                const lookahead: number[] = [];
                for (let l = 0; l < lookCount; l++) lookahead.push(byte_ar.readUnsignedShort());

                const lookupCount = byte_ar.readUnsignedShort();
                const records: Array<{ sequenceIndex: number; lookupListIndex: number }> = [];
                for (let k = 0; k < lookupCount; k++) {
                    const sequenceIndex = byte_ar.readUnsignedShort();
                    const lookupListIndex = byte_ar.readUnsignedShort();
                    records.push({ sequenceIndex, lookupListIndex });
                }
                rules.push({ backtrack, input, lookahead, records });
            }
            this.classSets[i] = rules;
        }
    }

    applyToGlyphs(glyphs: number[]): number[] {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    }

    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[] {
        if (!this.coverage || !this.inputClassDef || !this.backtrackClassDef || !this.lookaheadClassDef) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            const covIndex = this.coverage.findGlyph(out[i]);
            if (covIndex < 0) {
                i++;
                continue;
            }
            const classId = this.inputClassDef.getGlyphClass(out[i]);
            const rules = this.classSets[classId] || [];
            let applied = false;
            for (const rule of rules) {
                const backOk = matchBacktrackSequence(out, i, rule.backtrack, (expected, gid) => this.backtrackClassDef!.getGlyphClass(gid) === expected, ctx);
                if (!backOk) continue;
                const matched = matchInputSequence(out, i, rule.input, (expected, gid) => this.inputClassDef!.getGlyphClass(gid) === expected, ctx);
                if (!matched) continue;
                const lookStart = matched[matched.length - 1] ?? i;
                const lookOk = matchLookaheadSequence(out, lookStart, rule.lookahead, (expected, gid) => this.lookaheadClassDef!.getGlyphClass(gid) === expected, ctx);
                if (!lookOk) continue;

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
