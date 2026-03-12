import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

type VdmxRatio = { bCharSet: number; xRatio: number; yStartRatio: number; yEndRatio: number };
type VdmxEntry = { yPelHeight: number; yMax: number; yMin: number };
type VdmxGroup = { recs: number; startsz: number; endsz: number; entries: VdmxEntry[] };

export class VdmxTable implements ITable {
    version: number;
    numRecs: number;
    numRatios: number;
    ratios: VdmxRatio[];
    offsets: number[];
    groups: VdmxGroup[];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numRecs = byte_ar.readUnsignedShort();
        this.numRatios = byte_ar.readUnsignedShort();
        this.ratios = [];
        for (let i = 0; i < this.numRatios; i++) {
            this.ratios.push({
                bCharSet: byte_ar.readUnsignedByte(),
                xRatio: byte_ar.readUnsignedByte(),
                yStartRatio: byte_ar.readUnsignedByte(),
                yEndRatio: byte_ar.readUnsignedByte()
            });
        }
        this.offsets = [];
        for (let i = 0; i < this.numRatios; i++) this.offsets.push(byte_ar.readUnsignedShort());
        this.groups = this.offsets.map((offset) => this.readGroup(byte_ar, de.offset + offset));
    }

    private readGroup(byte_ar: ByteArray, offset: number): VdmxGroup {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const recs = byte_ar.readUnsignedShort();
        const startsz = byte_ar.readUnsignedByte();
        const endsz = byte_ar.readUnsignedByte();
        const entries: VdmxEntry[] = [];
        for (let i = 0; i < recs; i++) {
            entries.push({
                yPelHeight: byte_ar.readUnsignedShort(),
                yMax: byte_ar.readShort(),
                yMin: byte_ar.readShort()
            });
        }
        byte_ar.offset = prev;
        return { recs, startsz, endsz, entries };
    }

    getType(): number {
        return Table.VDMX;
    }
}
