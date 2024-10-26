import { ByteArray } from "../utils/ByteArray";
import { LigatureSubstFormat1 } from "./LigatureSubstFormat1";
import { LookupSubtable } from "./LookupSubtable";

export class LigatureSubst extends LookupSubtable {
    
    /**
     * Reads a LigatureSubst from the given ByteArray and offset.
     * @param byteAr The ByteArray to read from.
     * @param offset The offset from which to start reading.
     * @return An instance of LigatureSubst or null if format is not recognized.
     */
    public static read(byteAr: ByteArray, offset: number): LigatureSubst | null {
        byteAr.offset = offset;
        const format: number = byteAr.readUnsignedShort();
        let ls: LigatureSubst | null = null;

        if (format === 1) {
            ls = new LigatureSubstFormat1(byteAr, offset);
        }

        return ls;
    }
}
