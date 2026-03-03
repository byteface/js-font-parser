import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";

export class MultipleSubstFormat1 extends LookupSubtable {
    private coverage: ICoverage | null;
    private sequences: number[][] = [];

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const sequenceCount = byte_ar.readUnsignedShort();
        const sequenceOffsets: number[] = [];
        for (let i = 0; i < sequenceCount; i++) {
            sequenceOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);

        for (let i = 0; i < sequenceOffsets.length; i++) {
            byte_ar.offset = offset + sequenceOffsets[i];
            const glyphCount = byte_ar.readUnsignedShort();
            const seq: number[] = [];
            for (let j = 0; j < glyphCount; j++) {
                seq.push(byte_ar.readUnsignedShort());
            }
            this.sequences[i] = seq;
        }
    }

    substitute(glyphId: number): number | null {
        if (!this.coverage) return null;
        const idx = this.coverage.findGlyph(glyphId);
        if (idx < 0) return null;
        const seq = this.sequences[idx];
        if (!seq || seq.length === 0) return null;
        return seq[0];
    }

    applyAt(glyphs: number[], index: number): number[] | null {
        if (!this.coverage) return null;
        const gid = glyphs[index];
        const idx = this.coverage.findGlyph(gid);
        if (idx < 0) return null;
        const seq = this.sequences[idx];
        if (!seq || seq.length === 0) return null;
        return glyphs.slice(0, index).concat(seq, glyphs.slice(index + 1));
    }

    applyToGlyphs(glyphs: number[]): number[] {
        if (!this.coverage) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i < out.length) {
            const idx = this.coverage.findGlyph(out[i]);
            if (idx < 0) {
                i++;
                continue;
            }
            const seq = this.sequences[idx];
            if (!seq || seq.length === 0) {
                i++;
                continue;
            }
            out = out.slice(0, i).concat(seq, out.slice(i + 1));
            i += seq.length;
        }
        return out;
    }
}
