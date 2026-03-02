import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

export class HeadTable  implements ITable {
    versionNumber: number;
    fontRevision: number;
    checkSumAdjustment: number;
    magicNumber: number;
    flags: number;
    unitsPerEm: number;
    created: number;
    modified: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    macStyle: number;
    lowestRecPPEM: number;
    fontDirectionHint: number;
    indexToLocFormat: number;
    glyphDataFormat: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {

        // console.log('HEAD TABLE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        byte_ar.offset = de.offset;

        this.versionNumber = byte_ar.readInt();
        this.fontRevision = byte_ar.readInt();
        this.checkSumAdjustment = byte_ar.readInt();
        this.magicNumber = byte_ar.readInt();
        this.flags = byte_ar.readShort();
        this.unitsPerEm = byte_ar.readShort();

        this.created = this.readLong(byte_ar);
        this.modified = this.readLong(byte_ar);

        this.xMin = byte_ar.readShort();
        this.yMin = byte_ar.readShort();
        this.xMax = byte_ar.readShort();
        this.yMax = byte_ar.readShort();
        this.macStyle = byte_ar.readShort();
        this.lowestRecPPEM = byte_ar.readShort();
        this.fontDirectionHint = byte_ar.readShort();
        this.indexToLocFormat = byte_ar.readShort();
        this.glyphDataFormat = byte_ar.readShort();


        // console.log( "HEAD_TABLE", this.toString() );
    }

    /**
     * TODO - put this on my bytearray class!!
     * Reads a long value from the byte array.
     * @param b The byte array.
     * @return The long value.
     */
    readLong(b: ByteArray): number {
        const high = (b.readUnsignedByte() << 24) | 
                     (b.readUnsignedByte() << 16) | 
                     (b.readUnsignedByte() << 8) | 
                     b.readUnsignedByte();
    
        const low = (b.readUnsignedByte() << 24) | 
                    (b.readUnsignedByte() << 16) | 
                    (b.readUnsignedByte() << 8) | 
                    b.readUnsignedByte();
    
        // Combine the two 32-bit values into a 64-bit number
        // Shift `high` by 32 bits and add the `low` part
        const num = (high * 2**32) + (low >>> 0); // Use `>>> 0` to ensure low is treated as unsigned
        return num;
    }

    getType(): number {
        return Table.head;
    }

    toString(): string {
        return `head
\tversionNumber: ${this.versionNumber}
\tfontRevision: ${this.fontRevision}
\tcheckSumAdjustment: ${this.checkSumAdjustment}
\tmagicNumber: ${this.magicNumber}
\tflags: ${this.flags}
\tunitsPerEm: ${this.unitsPerEm}
\tcreated: ${this.created}
\tmodified: ${this.modified}
\txMin: ${this.xMin}, yMin: ${this.yMin}
\txMax: ${this.xMax}, yMax: ${this.yMax}
\tmacStyle: ${this.macStyle}
\tlowestRecPPEM: ${this.lowestRecPPEM}
\tfontDirectionHint: ${this.fontDirectionHint}
\tindexToLocFormat: ${this.indexToLocFormat}
\tglyphDataFormat: ${this.glyphDataFormat}`;
    }
}
