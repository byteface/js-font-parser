import { LigatureSubstFormat1 } from "./LigatureSubstFormat1.js";
import { LookupSubtable } from "./LookupSubtable.js";
export class LigatureSubst extends LookupSubtable {
    /**
     * Reads a LigatureSubst from the given ByteArray and offset.
     * @param byteAr The ByteArray to read from.
     * @param offset The offset from which to start reading.
     * @return An instance of LigatureSubst or null if format is not recognized.
     */
    static read(byteAr, offset) {
        byteAr.offset = offset;
        const format = byteAr.readUnsignedShort();
        let ls = null;
        if (format === 1) {
            ls = new LigatureSubstFormat1(byteAr, offset);
        }
        return ls;
    }
}
