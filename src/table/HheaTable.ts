import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
import { ITable } from "./ITable.js";
import { DirectoryEntry } from "./DirectoryEntry.js";

export class HheaTable implements ITable {
    version: number;
    ascender: number;
    descender: number;
    lineGap: number;
    advanceWidthMax: number;
    minLeftSideBearing: number;
    minRightSideBearing: number;
    xMaxExtent: number;
    caretSlopeRise: number;
    caretSlopeRun: number;
    metricDataFormat: number;
    numberOfHMetrics: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;

        this.version = byte_ar.readInt();
        this.ascender = byte_ar.readShort();
        this.descender = byte_ar.readShort();
        this.lineGap = byte_ar.readShort();
        this.advanceWidthMax = byte_ar.readShort();
        this.minLeftSideBearing = byte_ar.readShort();
        this.minRightSideBearing = byte_ar.readShort();
        this.xMaxExtent = byte_ar.readShort();
        this.caretSlopeRise = byte_ar.readShort();
        this.caretSlopeRun = byte_ar.readShort();

        for (let i = 0; i < 5; i++) {
            byte_ar.readShort(); // Ignored values
        }

        this.metricDataFormat = byte_ar.readShort();
        this.numberOfHMetrics = byte_ar.readUnsignedShort();
    }

    getType(): number {
        return Table.hhea;
    }
}
