import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
import { ITable } from "./ITable.js";
import { DirectoryEntry } from "./DirectoryEntry.js";

export class VheaTable implements ITable {
    version: number;
    ascender: number;
    descender: number;
    lineGap: number;
    advanceHeightMax: number;
    minTopSideBearing: number;
    minBottomSideBearing: number;
    yMaxExtent: number;
    caretSlopeRise: number;
    caretSlopeRun: number;
    caretOffset: number;
    metricDataFormat: number;
    numberOfVMetrics: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readInt();
        this.ascender = byte_ar.readShort();
        this.descender = byte_ar.readShort();
        this.lineGap = byte_ar.readShort();
        this.advanceHeightMax = byte_ar.readUnsignedShort();
        this.minTopSideBearing = byte_ar.readShort();
        this.minBottomSideBearing = byte_ar.readShort();
        this.yMaxExtent = byte_ar.readShort();
        this.caretSlopeRise = byte_ar.readShort();
        this.caretSlopeRun = byte_ar.readShort();
        this.caretOffset = byte_ar.readShort();
        for (let i = 0; i < 4; i++) byte_ar.readShort();
        this.metricDataFormat = byte_ar.readShort();
        this.numberOfVMetrics = byte_ar.readUnsignedShort();
    }

    getType(): number {
        return Table.vhea;
    }
}
