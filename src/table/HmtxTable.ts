import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class HmtxTable implements ITable {
    private buf: ByteArray | null;
    private advanceWidths: number[] | null;
    private leftSideBearing: number[] | null;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {

        // console.log('HmtxTable --');

        byte_ar.offset = de.offset;

        this.advanceWidths = null;
        this.leftSideBearing = null;

        const start = byte_ar.offset;
        const length = de.length;

        // Create a new ArrayBuffer from the DataView
        const slicedBuffer = byte_ar.dataView.buffer.slice(start, start + length);
        const uint8Array = new Uint8Array(slicedBuffer);

        // Initialize the buffer using the sliced Uint8Array
        this.buf = new ByteArray(uint8Array); // No endian parameter

    }

    run(numberOfHMetrics: number, lsbCount: number): void {
        if (this.buf === null) {
            return;
        }

        this.advanceWidths = [];
        this.leftSideBearing = [];
        for (let i = 0; i < numberOfHMetrics; i++) {
            const advance = this.buf.readUnsignedShort();
            const lsb = this.buf.readShort();
            this.advanceWidths.push(advance);
            this.leftSideBearing.push(lsb);
        }

        if (lsbCount > 0) {
            for (let j = 0; j < lsbCount; j++) {
                this.leftSideBearing.push(this.buf.readShort());
            }
        }

        this.buf = null;
    }

    getAdvanceWidth(i: number): number {
        if (this.advanceWidths === null) {
            return 0;
        }

        if (i < this.advanceWidths.length) {
            return this.advanceWidths[i];
        } else {
            return this.advanceWidths[this.advanceWidths.length - 1];
        }
    }

    getLeftSideBearing(i: number): number {
        if (this.leftSideBearing === null) {
            return 0;
        }

        return this.leftSideBearing[i] ?? 0;
    }

    getType(): number {
        return Table.hmtx;
    }
}
