import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat {
    format: number;
    length: number;
    version: number;
    static create(format: number, byte_ar: ByteArray): ICmapFormat | null;
    toString(): string;
}
