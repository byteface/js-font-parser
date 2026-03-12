import { ByteArray } from "../utils/ByteArray.js";
export declare abstract class BaseTable {
    protected readTag(byte_ar: ByteArray): string;
    protected readLongDateTime(byte_ar: ByteArray): number;
}
