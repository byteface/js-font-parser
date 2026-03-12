import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";

type AvarMap = { from: number; to: number };

export class AvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    reserved: number;
    axisCount: number;
    segmentMaps: AvarMap[][];

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.reserved = byte_ar.readUnsignedShort();
        this.axisCount = byte_ar.readUnsignedShort();
        this.segmentMaps = [];
        for (let axis = 0; axis < this.axisCount; axis++) {
            const positionMapCount = byte_ar.readUnsignedShort();
            const maps: AvarMap[] = [];
            for (let i = 0; i < positionMapCount; i++) {
                maps.push({
                    from: byte_ar.readShort() / 16384,
                    to: byte_ar.readShort() / 16384
                });
            }
            this.segmentMaps.push(maps);
        }
    }

    public mapCoord(axisIndex: number, normalized: number): number {
        const maps = this.segmentMaps[axisIndex];
        if (!maps || maps.length === 0 || !Number.isFinite(normalized)) return normalized;
        const value = Math.max(-1, Math.min(1, normalized));
        if (value <= maps[0].from) return maps[0].to;
        if (value >= maps[maps.length - 1].from) return maps[maps.length - 1].to;
        for (let i = 0; i < maps.length - 1; i++) {
            const a = maps[i];
            const b = maps[i + 1];
            if (value < a.from || value > b.from) continue;
            const span = b.from - a.from;
            if (span === 0) return a.to;
            const t = (value - a.from) / span;
            return a.to + ((b.to - a.to) * t);
        }
        return value;
    }

    getType(): number {
        return Table.avar;
    }
}
