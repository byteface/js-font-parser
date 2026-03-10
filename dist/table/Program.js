// UNTESTED
export class Program {
    instructions = [];
    getInstructions() {
        return this.instructions;
    }
    /**
     *
     * @param byte_ar
     * @param count
     */
    readInstructions(byte_ar, count) {
        this.instructions = [];
        for (let i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    }
}
