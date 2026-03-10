import { ByteArray } from "../utils/ByteArray.js";
export declare class Program {
    private instructions;
    getInstructions(): number[];
    /**
     *
     * @param byte_ar
     * @param count
     */
    readInstructions(byte_ar: ByteArray, count: number): void;
}
