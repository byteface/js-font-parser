import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class LocaTable implements ITable {
    private buf: ByteArray | null;
    private offsets: number[] | null = [];
    private factor: number = 0;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset; // Set the position in the ByteArray

        // this.offsets = [];
        // this.factor = 0;
        // const extractedData = new Uint8Array(byte_ar.dataView.buffer).subarray(byte_ar.offset, byte_ar.offset + de.length);
        // this.buf =  new ByteArray(extractedData);

        // console.log('locaTable', byte_ar.offset, de.length)
        // console.log(`Buffer length: ${byte_ar.dataView.byteLength}`);

        // Extract the portion of the data corresponding to de.offset and de.length
        // const extractedData = new Uint8Array(byte_ar.dataView.buffer, byte_ar.offset, de.length);

        const extractedData = new Uint8Array(byte_ar.dataView.buffer.slice(byte_ar.offset, byte_ar.offset + de.length));

        // console.log('Bytes:', extractedData.byteLength);

        // Create a new ByteArray using the extracted data
        // this.buf = new ByteArray(extractedData);
        this.buf = new ByteArray(extractedData);

        // console.log('Buffer Bytes:', this.buf.dataView.byteLength);
        
        // console.log('New Buffer First Bytes:', Array.from(new Uint8Array(byte_ar.dataView.buffer, byte_ar.offset, 16)));

    }

    run(numGlyphs: number, shortEntries: boolean): void {
        if (this.buf === null) {
            return;
        }

        this.offsets = [];

        // const byteArray = new Uint8Array(this.buf.dataView.buffer);
        // console.log('Buffer Bytes:', byteArray);

        if (shortEntries) {
            this.factor = 2;
            for (let i = 0; i <= numGlyphs; i++) {
                // Read 2 bytes for short entries
                const offset = (this.buf.readUnsignedByte() << 8) | this.buf.readUnsignedByte();
                this.offsets.push(offset);
            }
        } else {
            this.factor = 1;
            for (let j = 0; j <= numGlyphs; j++) {
                const byte1 = this.buf.readUnsignedByte();
                const byte2 = this.buf.readUnsignedByte();
                const byte3 = this.buf.readUnsignedByte();
                const byte4 = this.buf.readUnsignedByte();
                
                this.offsets[j] = (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4;
            
                // console.log(`Glyph ${j}: [${byte1.toString(16)}, ${byte2.toString(16)}, ${byte3.toString(16)}, ${byte4.toString(16)}] -> Offset: ${this.offsets[j]}`);
            }
        }

        this.buf = null; // Clear the buffer after use (optional)

    }

    // logUint8Array(uint8Array) {
    //     const bytes = Array.from(uint8Array); // Convert to regular array for easier logging
    //     // console.log("Uint8Array Buffer Bytes:", bytes);
    // }


    getOffset(i: number): number {
        if (this.offsets === null) {
            return 0;
        }
        return this.offsets[i] * this.factor;
    }

    getType(): number {
        return Table.loca;
    }
}
