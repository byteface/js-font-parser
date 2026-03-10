import { LookupSubtable } from "./LookupSubtable.js";
import { AlternateSubstFormat1 } from "./AlternateSubstFormat1.js";
export class AlternateSubst extends LookupSubtable {
    static read(byte_ar, offset) {
        const format = byte_ar.dataView.getUint16(offset);
        if (format === 1) {
            return new AlternateSubstFormat1(byte_ar, offset);
        }
        return null;
    }
}
