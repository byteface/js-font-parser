import { ByteArray } from "../utils/ByteArray.js";
import { ClassDefFormat1 } from "./ClassDefFormat1.js";
import { ClassDefFormat2 } from "./ClassDefFormat2.js";

export class ClassDef {
    public getFormat(): number {
        return 0;
    }

    public static read(byte_ar: ByteArray): ClassDef | null {
        const format = byte_ar.readUnsignedShort();
        if (format === 1) {
            return new ClassDefFormat1(byte_ar);
        }
        if (format === 2) {
            return new ClassDefFormat2(byte_ar);
        }
        return null;
    }
}
