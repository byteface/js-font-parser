import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
export declare class LigatureSubst extends LookupSubtable {
    /**
     * Reads a LigatureSubst from the given ByteArray and offset.
     * @param byteAr The ByteArray to read from.
     * @param offset The offset from which to start reading.
     * @return An instance of LigatureSubst or null if format is not recognized.
     */
    static read(byteAr: ByteArray, offset: number): LigatureSubst | null;
}
