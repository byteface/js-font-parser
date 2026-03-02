// UNTESTED

import { ByteArray } from "../utils/ByteArray.js"
import { LookupSubtable } from "./LookupSubtable.js"
import { SingleSubstFormat1 } from "./SingleSubstFormat1.js"
import { SingleSubstFormat2 } from "./SingleSubstFormat2.js";

	
export class SingleSubst extends LookupSubtable {

    public static read(byte_ar: ByteArray, offset: number): SingleSubst | null {
        let s: SingleSubst | null = null;
        byte_ar.offset = offset;
        const format: number = byte_ar.readUnsignedShort();
        
        if (format === 1) {
            s = new SingleSubstFormat1(byte_ar, offset);
        } else if (format === 2) {
            s = new SingleSubstFormat2(byte_ar, offset);
        }
        
        return s;
    }
}
