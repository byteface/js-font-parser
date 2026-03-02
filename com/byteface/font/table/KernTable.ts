import { ByteArray } from "../utils/ByteArray.js";
import { ITable } from "./ITable.js";
import { KernSubtable } from "./KernSubtable.js";
import { KernSubtableFormat0 } from "./KernSubtableFormat0.js";
import { KernSubtableFormat2 } from "./KernSubtableFormat2.js";
import { Table } from "./Table.js";


export class KernTable implements ITable {
    version: number;
    nTables: number;
    tables: Array<KernSubtable | null>;

    constructor(de: any, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.nTables = byte_ar.readUnsignedShort();
        this.tables = new Array<KernSubtable | null>(this.nTables);

        for (let i = 0; i < this.nTables; i++) {
            const start = byte_ar.offset;
            // subtable header
            byte_ar.readUnsignedShort(); // version
            const length = byte_ar.readUnsignedShort();
            const coverage = byte_ar.readUnsignedShort();
            const format = coverage >> 8;

            let table: KernSubtable | null = null;
            switch (format) {
                case 0:
                    table = new KernSubtableFormat0(byte_ar);
                    break;
                case 2:
                    table = new KernSubtableFormat2(byte_ar);
                    break;
                default:
                    console.warn(`Unsupported KernSubtable format: ${format}`);
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

    getSubtableCount(): number {
        return this.nTables;
    }

    getSubtable(i: number): KernSubtable | null {
        return this.tables[i];
    }

    getKerningValue(leftGlyph: number, rightGlyph: number): number {
        for (const subtable of this.tables) {
            if (subtable && subtable instanceof KernSubtableFormat0) {
                return subtable.getKerningValue(leftGlyph, rightGlyph);
            }
        }
        return 0;
    }

    getType(): number {
        return Table.kern;
    }
}
