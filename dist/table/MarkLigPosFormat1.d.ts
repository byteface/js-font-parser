import { ByteArray } from '../utils/ByteArray.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { LigatureArray } from './LigatureArray.js';
export declare class MarkLigPosFormat1 extends LookupSubtable {
    markCoverage: ICoverage | null;
    ligatureCoverage: ICoverage | null;
    markClassCount: number;
    markArray: MarkArray | null;
    ligatureArray: LigatureArray | null;
    constructor(byte_ar: ByteArray, offset: number);
}
