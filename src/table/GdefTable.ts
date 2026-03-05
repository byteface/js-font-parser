import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";
import { ClassDef } from "./ClassDef.js";
import { ClassDefReader } from "./ClassDefReader.js";
import { Coverage } from "./Coverage.js";
import { ICoverage } from "./ICoverage.js";

export class GdefTable implements ITable {
    private glyphClassDef: ClassDef | null = null;
    private markAttachClassDef: ClassDef | null = null;
    private markGlyphSets: ICoverage[] = [];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        const start = de.offset;
        byte_ar.offset = start;
        const major = byte_ar.readUnsignedShort();
        const minor = byte_ar.readUnsignedShort();
        if (major !== 1) return;

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
                const offsets: number[] = [];
                for (let i = 0; i < count; i++) offsets.push(byte_ar.readUnsignedShort());
                this.markGlyphSets = offsets
                    .map(off => {
                        byte_ar.offset = start + markGlyphSetsDefOffset + off;
                        return Coverage.read(byte_ar);
                    })
                    .filter((c): c is ICoverage => !!c);
            }
        }
    }

    getType(): number {
        return Table.GDEF;
    }

    getGlyphClass(glyphId: number): number {
        return this.glyphClassDef?.getGlyphClass(glyphId) ?? 0;
    }

    getMarkAttachmentClass(glyphId: number): number {
        return this.markAttachClassDef?.getGlyphClass(glyphId) ?? 0;
    }

    isGlyphInMarkSet(setIndex: number, glyphId: number): boolean {
        const coverage = this.markGlyphSets[setIndex];
        if (!coverage) return false;
        return coverage.findGlyph(glyphId) >= 0;
    }
}
