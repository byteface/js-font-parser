import { LookupSubtable } from "./LookupSubtable.js";
import { ContextSubstFormat1 } from "./ContextSubstFormat1.js";
import { ContextSubstFormat2 } from "./ContextSubstFormat2.js";
import { ContextSubstFormat3 } from "./ContextSubstFormat3.js";
export class ContextSubst extends LookupSubtable {
    static read(byte_ar, offset, gsub) {
        const format = byte_ar.dataView.getUint16(offset);
        if (format === 1)
            return new ContextSubstFormat1(byte_ar, offset, gsub);
        if (format === 2)
            return new ContextSubstFormat2(byte_ar, offset, gsub);
        if (format === 3)
            return new ContextSubstFormat3(byte_ar, offset, gsub);
        return null;
    }
}
