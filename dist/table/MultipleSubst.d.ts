import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
export declare class MultipleSubst extends LookupSubtable {
    static read(byte_ar: ByteArray, offset: number): MultipleSubst | null;
}
