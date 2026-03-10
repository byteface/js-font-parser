import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
export declare class AlternateSubst extends LookupSubtable {
    static read(byte_ar: ByteArray, offset: number): AlternateSubst | null;
}
