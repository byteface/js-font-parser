import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";

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
        if (this.inputCount === 0 || this.inputCoverages.length !== this.inputCount) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i <= out.length - this.inputCount) {
            // backtrack
            let match = true;
            for (let b = 0; b < this.backtrackCoverages.length; b++) {
                const idx = i - 1 - b;
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
            for (let j = 0; j < this.inputCount; j++) {
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
            for (let l = 0; l < this.lookaheadCoverages.length; l++) {
                const idx = i + this.inputCount + l;
                if (idx >= out.length || this.lookaheadCoverages[l].findGlyph(out[idx]) < 0) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                i++;
                continue;
            }

            for (const rec of this.records) {
                out = this.gsub.applyLookupAt(rec.lookupListIndex, out, i + rec.sequenceIndex);
            }
            i += this.inputCount;
        }
        return out;
    }
}
