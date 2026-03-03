import { ByteArray } from "../utils/ByteArray.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";

export class ContextSubstFormat3 extends LookupSubtable {
    private glyphCount: number;
    private lookupCount: number;
    private coverages: ICoverage[] = [];
    private records: Array<{ sequenceIndex: number; lookupListIndex: number }> = [];
    private gsub: GsubTable;

    constructor(byte_ar: ByteArray, offset: number, gsub: GsubTable) {
        super();
        this.gsub = gsub;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 3) {
            this.glyphCount = 0;
            this.lookupCount = 0;
            return;
        }
        this.glyphCount = byte_ar.readUnsignedShort();
        this.lookupCount = byte_ar.readUnsignedShort();
        const coverageOffsets: number[] = [];
        for (let i = 0; i < this.glyphCount; i++) {
            coverageOffsets.push(byte_ar.readUnsignedShort());
        }
        for (let i = 0; i < this.lookupCount; i++) {
            const sequenceIndex = byte_ar.readUnsignedShort();
            const lookupListIndex = byte_ar.readUnsignedShort();
            this.records.push({ sequenceIndex, lookupListIndex });
        }
        this.coverages = coverageOffsets
            .map(off => {
                byte_ar.offset = offset + off;
                return Coverage.read(byte_ar);
            })
            .filter((c): c is ICoverage => !!c);
    }

    applyToGlyphs(glyphs: number[]): number[] {
        if (this.glyphCount === 0 || this.coverages.length !== this.glyphCount) return glyphs;
        let out = glyphs.slice();
        let i = 0;
        while (i <= out.length - this.glyphCount) {
            let match = true;
            for (let j = 0; j < this.glyphCount; j++) {
                const cov = this.coverages[j];
                if (!cov || cov.findGlyph(out[i + j]) < 0) {
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
            i += this.glyphCount;
        }
        return out;
    }
}
