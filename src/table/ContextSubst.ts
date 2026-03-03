import { ByteArray } from "../utils/ByteArray.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { ContextSubstFormat3 } from "./ContextSubstFormat3.js";
import { GsubTable } from "./GsubTable.js";

export class ContextSubst extends LookupSubtable {
    public static read(byte_ar: ByteArray, offset: number, gsub: GsubTable): ContextSubst | null {
        const format = byte_ar.dataView.getUint16(offset);
        if (format === 3) {
            return new ContextSubstFormat3(byte_ar, offset, gsub);
        }
        return null;
    }
}
