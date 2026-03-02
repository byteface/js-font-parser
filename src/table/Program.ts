// UNTESTED

import { ByteArray } from "../utils/ByteArray.js";

export class Program {
    private instructions: number[] = [];

    public getInstructions(): number[] {
        return this.instructions;
    }

    /**
     * 
     * @param byte_ar 
     * @param count 
     */		
    public readInstructions(byte_ar: ByteArray, count: number): void {
        this.instructions = [];
        for (let i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    }
}
