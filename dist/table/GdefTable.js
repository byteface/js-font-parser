import { Table } from "./Table.js";
import { ClassDefReader } from "./ClassDefReader.js";
import { Coverage } from "./Coverage.js";
export class GdefTable {
    glyphClassDef = null;
    markAttachClassDef = null;
    markGlyphSets = [];
    constructor(de, byte_ar) {
        const start = de.offset;
        byte_ar.offset = start;
        const major = byte_ar.readUnsignedShort();
        const minor = byte_ar.readUnsignedShort();
        if (major !== 1)
            return;
        const glyphClassDefOffset = byte_ar.readUnsignedShort();
        byte_ar.readUnsignedShort(); // attachListOffset
        byte_ar.readUnsignedShort(); // ligCaretListOffset
        const markAttachClassDefOffset = byte_ar.readUnsignedShort();
        let markGlyphSetsDefOffset = 0;
        if (major > 1 || minor >= 2) {
            markGlyphSetsDefOffset = byte_ar.readUnsignedShort();
            if (minor >= 3) {
                byte_ar.readUnsignedInt(); // itemVarStoreOffset
            }
        }
        if (glyphClassDefOffset) {
            byte_ar.offset = start + glyphClassDefOffset;
            this.glyphClassDef = ClassDefReader.read(byte_ar);
        }
        if (markAttachClassDefOffset) {
            byte_ar.offset = start + markAttachClassDefOffset;
            this.markAttachClassDef = ClassDefReader.read(byte_ar);
        }
        if (markGlyphSetsDefOffset) {
            byte_ar.offset = start + markGlyphSetsDefOffset;
            const format = byte_ar.readUnsignedShort();
            if (format === 1) {
                const count = byte_ar.readUnsignedShort();
                const offsets = [];
                for (let i = 0; i < count; i++)
                    offsets.push(byte_ar.readUnsignedShort());
                this.markGlyphSets = offsets
                    .map(off => {
                    byte_ar.offset = start + markGlyphSetsDefOffset + off;
                    return Coverage.read(byte_ar);
                })
                    .filter((c) => !!c);
            }
        }
    }
    getType() {
        return Table.GDEF;
    }
    getGlyphClass(glyphId) {
        return this.glyphClassDef?.getGlyphClass(glyphId) ?? 0;
    }
    getMarkAttachmentClass(glyphId) {
        return this.markAttachClassDef?.getGlyphClass(glyphId) ?? 0;
    }
    isGlyphInMarkSet(setIndex, glyphId) {
        const coverage = this.markGlyphSets[setIndex];
        if (!coverage)
            return false;
        return coverage.findGlyph(glyphId) >= 0;
    }
}
