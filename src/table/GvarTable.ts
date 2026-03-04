import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { Table } from './Table.js';

type TupleHeader = {
    dataOffset: number;
    dataSize: number;
    peak: number[];
    start?: number[];
    end?: number[];
    hasPrivatePoints: boolean;
};

export class GvarTable implements ITable {
    private start: number;
    private view: DataView;
    private axisCount: number = 0;
    private glyphCount: number = 0;
    private sharedTuples: number[][] = [];
    private offsets: number[] = [];
    private dataOffset: number = 0;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        this.start = de.offset;
        this.view = byte_ar.dataView;
        byte_ar.seek(this.start);
        byte_ar.readFixed(); // version
        this.axisCount = byte_ar.readUnsignedShort();
        const sharedTupleCount = byte_ar.readUnsignedShort();
        const sharedTupleOffset = byte_ar.readUnsignedInt();
        this.glyphCount = byte_ar.readUnsignedShort();
        const flags = byte_ar.readUnsignedShort();
        const glyphVariationDataArrayOffset = byte_ar.readUnsignedInt();
        this.dataOffset = this.start + glyphVariationDataArrayOffset;

        const offsetCount = this.glyphCount + 1;
        this.offsets = [];
        if ((flags & 0x0001) === 0) {
            for (let i = 0; i < offsetCount; i++) {
                const val = byte_ar.readUnsignedShort();
                this.offsets.push(val * 2);
            }
        } else {
            for (let i = 0; i < offsetCount; i++) {
                this.offsets.push(byte_ar.readUnsignedInt());
            }
        }

        this.sharedTuples = [];
        if (sharedTupleCount > 0) {
            let cursor = this.start + sharedTupleOffset;
            for (let i = 0; i < sharedTupleCount; i++) {
                const tuple: number[] = [];
                for (let a = 0; a < this.axisCount; a++) {
                    tuple.push(this.readF2Dot14(cursor));
                    cursor += 2;
                }
                this.sharedTuples.push(tuple);
            }
        }
    }

    getType(): number {
        return Table.gvar;
    }

    getDeltasForGlyph(glyphId: number, coords: number[], pointCount: number): { dx: number[]; dy: number[] } | null {
        if (glyphId < 0 || glyphId >= this.glyphCount) return null;
        const start = this.dataOffset + this.offsets[glyphId];
        const end = this.dataOffset + this.offsets[glyphId + 1];
        if (start === end) return null;

        let cursor = start;
        const tupleVariationCount = this.view.getUint16(cursor, false);
        cursor += 2;
        const hasSharedPoints = (tupleVariationCount & 0x8000) !== 0;
        const count = tupleVariationCount & 0x0fff;
        const tuples: TupleHeader[] = [];

        for (let i = 0; i < count; i++) {
            const dataSize = this.view.getUint16(cursor, false);
            const tupleIndex = this.view.getUint16(cursor + 2, false);
            cursor += 4;

            const hasEmbeddedPeak = (tupleIndex & 0x8000) !== 0;
            const hasIntermediate = (tupleIndex & 0x4000) !== 0;
            const hasPrivatePoints = (tupleIndex & 0x2000) !== 0;
            const sharedIndex = tupleIndex & 0x0fff;

            const peak = hasEmbeddedPeak
                ? this.readTuple(cursor)
                : (this.sharedTuples[sharedIndex] ?? new Array(this.axisCount).fill(0));
            if (hasEmbeddedPeak) cursor += this.axisCount * 2;

            let startTuple: number[] | undefined;
            let endTuple: number[] | undefined;
            if (hasIntermediate) {
                startTuple = this.readTuple(cursor);
                cursor += this.axisCount * 2;
                endTuple = this.readTuple(cursor);
                cursor += this.axisCount * 2;
            }

            tuples.push({
                dataOffset: cursor,
                dataSize,
                peak,
                start: startTuple,
                end: endTuple,
                hasPrivatePoints
            });
            cursor += dataSize;
        }

        let sharedPoints: number[] | null = null;
        if (hasSharedPoints) {
            const result = this.readPointNumbers(cursor, pointCount);
            sharedPoints = result.points;
            cursor += result.size;
        }

        const dx = new Array(pointCount).fill(0);
        const dy = new Array(pointCount).fill(0);

        for (const tuple of tuples) {
            const scalar = this.computeScalar(coords, tuple.peak, tuple.start, tuple.end);
            if (scalar === 0) continue;
            let pCursor = tuple.dataOffset;

            let points: number[] | null = null;
            if (tuple.hasPrivatePoints) {
                const result = this.readPointNumbers(pCursor, pointCount);
                points = result.points;
                pCursor += result.size;
            } else if (sharedPoints) {
                points = sharedPoints;
            }

            const indices = points ?? this.rangePoints(pointCount);
            const deltasX = this.readPackedDeltas(pCursor, indices.length);
            pCursor += deltasX.size;
            const deltasY = this.readPackedDeltas(pCursor, indices.length);

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                if (idx >= 0 && idx < pointCount) {
                    dx[idx] += deltasX.values[i] * scalar;
                    dy[idx] += deltasY.values[i] * scalar;
                }
            }
        }

        return { dx, dy };
    }

    private rangePoints(count: number): number[] {
        return Array.from({ length: count }, (_, i) => i);
    }

    private computeScalar(coords: number[], peak: number[], start?: number[], end?: number[]): number {
        let scalar = 1;
        for (let i = 0; i < this.axisCount; i++) {
            const coord = coords[i] ?? 0;
            const peakVal = peak[i] ?? 0;
            if (coord === 0) {
                scalar = 0;
                break;
            }
            if (start && end) {
                const s = start[i] ?? 0;
                const e = end[i] ?? 0;
                if (coord < s || coord > e) return 0;
                if (coord < peakVal) scalar *= (coord - s) / (peakVal - s);
                else if (coord > peakVal) scalar *= (e - coord) / (e - peakVal);
            } else {
                if ((coord > 0 && peakVal < 0) || (coord < 0 && peakVal > 0)) return 0;
                scalar *= coord / peakVal;
            }
        }
        return scalar;
    }

    private readTuple(offset: number): number[] {
        const tuple: number[] = [];
        for (let i = 0; i < this.axisCount; i++) {
            tuple.push(this.readF2Dot14(offset + i * 2));
        }
        return tuple;
    }

    private readF2Dot14(offset: number): number {
        const raw = this.view.getInt16(offset, false);
        return raw / 16384;
    }

    private readPointNumbers(offset: number, pointCount: number): { points: number[]; size: number } {
        let cursor = offset;
        let count = this.view.getUint8(cursor++);
        if (count === 0) {
            return { points: this.rangePoints(pointCount), size: 1 };
        }
        if (count & 0x80) {
            count = ((count & 0x7f) << 8) | this.view.getUint8(cursor++);
        }
        const points: number[] = [];
        let last = 0;
        while (points.length < count) {
            const control = this.view.getUint8(cursor++);
            const runCount = (control & 0x7f) + 1;
            if (control & 0x80) {
                for (let i = 0; i < runCount; i++) {
                    last += this.view.getUint16(cursor, false);
                    cursor += 2;
                    points.push(last);
                }
            } else {
                for (let i = 0; i < runCount; i++) {
                    last += this.view.getUint8(cursor++);
                    points.push(last);
                }
            }
        }
        return { points, size: cursor - offset };
    }

    private readPackedDeltas(offset: number, count: number): { values: number[]; size: number } {
        let cursor = offset;
        const values: number[] = [];
        while (values.length < count) {
            const control = this.view.getUint8(cursor++);
            const runCount = (control & 0x3f) + 1;
            if (control & 0x80) {
                for (let i = 0; i < runCount; i++) {
                    values.push(this.view.getInt16(cursor, false));
                    cursor += 2;
                }
            } else if (control & 0x40) {
                for (let i = 0; i < runCount; i++) values.push(0);
            } else {
                for (let i = 0; i < runCount; i++) {
                    values.push(this.view.getInt8(cursor++));
                }
            }
        }
        return { values, size: cursor - offset };
    }
}
