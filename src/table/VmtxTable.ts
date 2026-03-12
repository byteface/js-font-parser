import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class VmtxTable implements ITable {
    private buf: ByteArray | null;
    private advanceHeights: number[] | null;
    private topSideBearings: number[] | null;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.advanceHeights = null;
        this.topSideBearings = null;
        const start = byte_ar.offset;
        const slicedBuffer = byte_ar.dataView.buffer.slice(start, start + de.length);
        this.buf = new ByteArray(new Uint8Array(slicedBuffer));
    }

    run(numberOfVMetrics: number, tsbCount: number): void {
        if (this.buf === null) return;
        this.advanceHeights = [];
        this.topSideBearings = [];
        for (let i = 0; i < numberOfVMetrics; i++) {
            this.advanceHeights.push(this.buf.readUnsignedShort());
            this.topSideBearings.push(this.buf.readShort());
        }
        for (let i = 0; i < tsbCount; i++) {
            this.topSideBearings.push(this.buf.readShort());
        }
        this.buf = null;
    }

    getAdvanceHeight(i: number): number {
        if (this.advanceHeights === null || this.advanceHeights.length === 0) return 0;
        return i < this.advanceHeights.length ? this.advanceHeights[i] : this.advanceHeights[this.advanceHeights.length - 1];
    }

    getTopSideBearing(i: number): number {
        if (this.topSideBearings === null) return 0;
        return this.topSideBearings[i] ?? 0;
    }

    getType(): number {
        return Table.vmtx;
    }
}
