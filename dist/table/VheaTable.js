import { Table } from "./Table.js";
export class VheaTable {
    version;
    ascender;
    descender;
    lineGap;
    advanceHeightMax;
    minTopSideBearing;
    minBottomSideBearing;
    yMaxExtent;
    caretSlopeRise;
    caretSlopeRun;
    caretOffset;
    metricDataFormat;
    numberOfVMetrics;
    constructor(de, byte_ar) {
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
        for (let i = 0; i < 4; i++)
            byte_ar.readShort();
        this.metricDataFormat = byte_ar.readShort();
        this.numberOfVMetrics = byte_ar.readUnsignedShort();
    }
    getType() {
        return Table.vhea;
    }
}
