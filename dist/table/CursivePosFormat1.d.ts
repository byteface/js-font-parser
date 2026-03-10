import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { Anchor } from './Anchor.js';
export type CursiveRecord = {
    entry: Anchor | null;
    exit: Anchor | null;
};
export declare class CursivePosFormat1 extends LookupSubtable {
    coverage: ICoverage | null;
    entryExitRecords: CursiveRecord[];
    constructor(byte_ar: ByteArray, offset: number);
}
