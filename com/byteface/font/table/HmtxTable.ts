import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { Table } from "./Table.js";

export class HmtxTable {
    private buf: ByteArray | null;
    private hMetrics: number[] | null;
    private leftSideBearing: number[] | null;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {

        // console.log('HmtxTable --');

        byte_ar.offset = de.offset;

        this.hMetrics = null;
        this.leftSideBearing = null;

        // TODO - don't trust this. as it was sliced off before
        // Initialize buf with byte_ar data
        // this.buf = new ByteArray(byte_ar.dataView);
        // this.buf = byte_ar; // Directly assign the ByteArray

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

        this.hMetrics = [];
        for (let i = 0; i < numberOfHMetrics; i++) {
            // Pack 4 bytes from buf into an int and store in hMetrics[]
            this.hMetrics.push(
                (this.buf.readUnsignedByte() << 24) |
                (this.buf.readUnsignedByte() << 16) |
                (this.buf.readUnsignedByte() << 8) |
                (this.buf.readUnsignedByte())
            );
        }

        if (lsbCount > 0) {
            this.leftSideBearing = [];
            for (let j = 0; j < lsbCount; j++) {
                this.leftSideBearing.push(
                    (this.buf.readUnsignedByte() << 8) |
                    (this.buf.readUnsignedByte())
                );
            }
        }

        this.buf = null;
    }

    getAdvanceWidth(i: number): number {
        if (this.hMetrics === null) {
            return 0;
        }

        if (i < this.hMetrics.length) {
            return this.hMetrics[i] >> 16;
        } else {
            return this.hMetrics[this.hMetrics.length - 1] >> 16;
        }
    }

    getLeftSideBearing(i: number): number {
        if (this.hMetrics === null) {
            return 0;
        }

        if (i < this.hMetrics.length) {
            return this.hMetrics[i]; // No need for bitwise AND in TypeScript
        } else {
            return this.leftSideBearing ? this.leftSideBearing[i - this.hMetrics.length] : 0;
        }
    }

    getType(): number {
        return Table.hmtx;
    }
}
