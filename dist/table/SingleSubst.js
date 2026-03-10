// UNTESTED
import { LookupSubtable } from "./LookupSubtable.js";
import { SingleSubstFormat1 } from "./SingleSubstFormat1.js";
import { SingleSubstFormat2 } from "./SingleSubstFormat2.js";
export class SingleSubst extends LookupSubtable {
    static read(byte_ar, offset) {
        let s = null;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        if (format === 1) {
            s = new SingleSubstFormat1(byte_ar, offset);
        }
        else if (format === 2) {
            s = new SingleSubstFormat2(byte_ar, offset);
        }
        return s;
    }
}
