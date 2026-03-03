import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";

export class AlternateSubstFormat1 extends LookupSubtable {
    private coverage: ICoverage | null;
    private alternates: number[][] = [];

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const altSetCount = byte_ar.readUnsignedShort();
        const altSetOffsets: number[] = [];
        for (let i = 0; i < altSetCount; i++) {
            altSetOffsets.push(byte_ar.readUnsignedShort());
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);

        for (let i = 0; i < altSetOffsets.length; i++) {
            byte_ar.offset = offset + altSetOffsets[i];
            const glyphCount = byte_ar.readUnsignedShort();
            const alts: number[] = [];
            for (let j = 0; j < glyphCount; j++) {
                alts.push(byte_ar.readUnsignedShort());
            }
            this.alternates[i] = alts;
        }
    }

    substitute(glyphId: number): number | null {
        if (!this.coverage) return null;
        const idx = this.coverage.findGlyph(glyphId);
        if (idx < 0) return null;
        const alts = this.alternates[idx];
        if (!alts || alts.length === 0) return null;
        return alts[0];
    }

    applyAt(glyphs: number[], index: number): number[] | null {
        const gid = glyphs[index];
        const sub = this.substitute(gid);
        if (sub == null) return null;
        const out = glyphs.slice();
        out[index] = sub;
        return out;
    }

    applyToGlyphs(glyphs: number[]): number[] {
        if (!this.coverage) return glyphs;
        return glyphs.map(g => this.substitute(g) ?? g);
    }
}
