import { KernSubtableFormat0 } from "./KernSubtableFormat0.js";
import { KernSubtableFormat2 } from "./KernSubtableFormat2.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
export class KernTable {
    version;
    nTables;
    tables;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.nTables = byte_ar.readUnsignedShort();
        this.tables = new Array(this.nTables);
        for (let i = 0; i < this.nTables; i++) {
            const start = byte_ar.offset;
            // subtable header
            byte_ar.readUnsignedShort(); // version
            const length = byte_ar.readUnsignedShort();
            const coverage = byte_ar.readUnsignedShort();
            const format = coverage >> 8;
            let table = null;
            switch (format) {
                case 0:
                    table = new KernSubtableFormat0(byte_ar);
                    break;
                case 2:
                    table = new KernSubtableFormat2(byte_ar);
                    break;
                default:
                    Debug.warn(`Unsupported KernSubtable format: ${format}`);
                    break;
            }
            // Ensure we move to the end of the subtable
            const expectedEnd = start + length;
            if (byte_ar.offset < expectedEnd) {
                byte_ar.offset = expectedEnd;
            }
            this.tables[i] = table;
        }
    }
    getSubtableCount() {
        return this.nTables;
    }
    getSubtable(i) {
        return this.tables[i];
    }
    getKerningValue(leftGlyph, rightGlyph) {
        for (const subtable of this.tables) {
            if (subtable && subtable instanceof KernSubtableFormat0) {
                const value = subtable.getKerningValue(leftGlyph, rightGlyph);
                if (value !== 0)
                    return value;
            }
        }
        return 0;
    }
    getType() {
        return Table.kern;
    }
}
