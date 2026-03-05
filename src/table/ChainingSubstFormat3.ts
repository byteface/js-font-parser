import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
import { GsubMatchContext, matchBacktrackSequence, matchInputSequence, matchLookaheadSequence, nextNonIgnoredIndex } from "./GsubMatch.js";

export class ChainingSubstFormat3 extends LookupSubtable {
    private backtrackCount: number;
    private inputCount: number;
    private lookaheadCount: number;
    private backtrackCoverages: ICoverage[] = [];
    private inputCoverages: ICoverage[] = [];
    private lookaheadCoverages: ICoverage[] = [];
    private records: Array<{ sequenceIndex: number; lookupListIndex: number }> = [];
    private gsub: GsubTable;

    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable) {
        super();
        this.gsub = gsub;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            this.backtrackCount = 0;
            this.inputCount = 0;
            this.lookaheadCount = 0;
            return;
        }
        this.backtrackCount = byte_ar.readUnsignedShort();
        const backtrackOffsets: number[] = [];
        for (let i = 0; i < this.backtrackCount; i++) backtrackOffsets.push(byte_ar.readUnsignedShort());

        this.inputCount = byte_ar.readUnsignedShort();
        const inputOffsets: number[] = [];
        for (let i = 0; i < this.inputCount; i++) inputOffsets.push(byte_ar.readUnsignedShort());

        this.lookaheadCount = byte_ar.readUnsignedShort();
        const lookaheadOffsets: number[] = [];
        for (let i = 0; i < this.lookaheadCount; i++) lookaheadOffsets.push(byte_ar.readUnsignedShort());

        const lookupCount = byte_ar.readUnsignedShort();
        for (let i = 0; i < lookupCount; i++) {
            const sequenceIndex = byte_ar.readUnsignedShort();
            const lookupListIndex = byte_ar.readUnsignedShort();
            this.records.push({ sequenceIndex, lookupListIndex });
        }

        this.backtrackCoverages = backtrackOffsets
            .map(off => {
                byte_ar.offset = offset + off;
                return Coverage.read(byte_ar);
            })
            .filter((c): c is ICoverage => !!c);

        this.inputCoverages = inputOffsets
            .map(off => {
                byte_ar.offset = offset + off;
                return Coverage.read(byte_ar);
            })
            .filter((c): c is ICoverage => !!c);

        this.lookaheadCoverages = lookaheadOffsets
            .map(off => {
                byte_ar.offset = offset + off;
                return Coverage.read(byte_ar);
            })
            .filter((c): c is ICoverage => !!c);
    }

    applyToGlyphs(glyphs: number[]): number[] {
        return this.applyToGlyphsWithContext(glyphs, undefined);
    }

    applyToGlyphsWithContext(glyphs: number[], ctx?: GsubMatchContext): number[] {
        if (this.inputCount === 0 || this.inputCoverages.length !== this.inputCount) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            i = nextNonIgnoredIndex(out, i, ctx);
            if (i >= out.length) break;
            const backOk = matchBacktrackSequence(out, i, this.backtrackCoverages, (expected, gid) => expected.findGlyph(gid) >= 0, ctx);
            if (!backOk) {
                i++;
                continue;
            }
            const matched = matchInputSequence(out, i, this.inputCoverages.slice(1), (expected, gid) => expected.findGlyph(gid) >= 0, ctx);
            if (!matched) {
                i++;
                continue;
            }
            if (this.inputCoverages[0].findGlyph(out[i]) < 0) {
                i++;
                continue;
            }
            const lookStart = matched[matched.length - 1] ?? i;
            const lookOk = matchLookaheadSequence(out, lookStart, this.lookaheadCoverages, (expected, gid) => expected.findGlyph(gid) >= 0, ctx);
            if (!lookOk) {
                i++;
                continue;
            }

            for (const rec of this.records) {
                const targetIndex = matched[rec.sequenceIndex] ?? (i + rec.sequenceIndex);
                out = this.gsub.applyLookupAt(rec.lookupListIndex, out, targetIndex);
            }
            i = (matched[matched.length - 1] ?? i) + 1;
        }
        return out;
    }
}
