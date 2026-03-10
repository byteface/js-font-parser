import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { Anchor } from './Anchor.js';
export class CursivePosFormat1 extends LookupSubtable {
    coverage;
    entryExitRecords = [];
    constructor(byte_ar, offset) {
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
        const records = [];
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
