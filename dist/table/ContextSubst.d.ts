import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { GsubTable } from "./GsubTable.js";
export declare class ContextSubst extends LookupSubtable {
    static read(byte_ar: ByteArray, offset: number, gsub: GsubTable): ContextSubst | null;
}
