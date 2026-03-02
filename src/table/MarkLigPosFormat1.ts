import { ByteArray } from '../utils/ByteArray.js';
import { Coverage } from './Coverage.js';
import { ICoverage } from './ICoverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { MarkArray } from './MarkArray.js';
import { LigatureArray } from './LigatureArray.js';

export class MarkLigPosFormat1 extends LookupSubtable {
    markCoverage: ICoverage | null;
    ligatureCoverage: ICoverage | null;
    markClassCount: number;
    markArray: MarkArray | null;
    ligatureArray: LigatureArray | null;

    constructor(byte_ar: ByteArray, offset: number) {
        super();
        const prev = byte_ar.offset;
        byte_ar.offset = offset;

        const format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            this.markCoverage = null;
            this.ligatureCoverage = null;
            this.markClassCount = 0;
            this.markArray = null;
            this.ligatureArray = null;
            byte_ar.offset = prev;
            return;
        }

        const markCoverageOffset = byte_ar.readUnsignedShort();
        const ligCoverageOffset = byte_ar.readUnsignedShort();
        this.markClassCount = byte_ar.readUnsignedShort();
        const markArrayOffset = byte_ar.readUnsignedShort();
        const ligArrayOffset = byte_ar.readUnsignedShort();

        byte_ar.offset = offset + markCoverageOffset;
        this.markCoverage = Coverage.read(byte_ar);
        byte_ar.offset = offset + ligCoverageOffset;
        this.ligatureCoverage = Coverage.read(byte_ar);

        this.markArray = new MarkArray(byte_ar, offset + markArrayOffset);
        this.ligatureArray = new LigatureArray(byte_ar, offset + ligArrayOffset, this.markClassCount);

        byte_ar.offset = prev;
    }
}
