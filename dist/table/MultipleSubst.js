import { LookupSubtable } from "./LookupSubtable.js";
import { MultipleSubstFormat1 } from "./MultipleSubstFormat1.js";
export class MultipleSubst extends LookupSubtable {
    static read(byte_ar, offset) {
        const format = byte_ar.dataView.getUint16(offset);
        if (format === 1) {
            return new MultipleSubstFormat1(byte_ar, offset);
        }
        return null;
    }
}
