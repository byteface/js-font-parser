import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { Anchor } from './Anchor.js';

export type CursiveRecord = {
    entry: Anchor | null;
    exit: Anchor | null;
};

export class CursivePosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    entryExitRecords: CursiveRecord[] = [];

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.coverage = null;
            byte_ar.offset = prev;
            return;
        }
        const coverageOffset = byte_ar.readUnsignedShort();
        const entryExitCount = byte_ar.readUnsignedShort();
        const records: Array<{ entryOffset: number; exitOffset: number }> = [];
        for (let i = 0; i < entryExitCount; i++) {
            records.push({
                entryOffset: byte_ar.readUnsignedShort(),
                exitOffset: byte_ar.readUnsignedShort()
            });
        }
        byte_ar.offset = offset + coverageOffset;
        this.coverage = Coverage.read(byte_ar);
        this.entryExitRecords = records.map(r => ({
            entry: Anchor.read(byte_ar, offset + r.entryOffset),
            exit: Anchor.read(byte_ar, offset + r.exitOffset)
        }));
        byte_ar.offset = prev;
    }
}
