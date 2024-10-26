// UNTESTED
var Program = /** @class */ (function () {
    function Program() {
        this.instructions = [];
    }
    Program.prototype.getInstructions = function () {
        return this.instructions;
    };
    /**
     *
     * @param byte_ar
     * @param count
     */
    Program.prototype.readInstructions = function (byte_ar, count) {
        this.instructions = [];
        for (var i = 0; i < count; i++) {
            this.instructions.push(byte_ar.readUnsignedByte());
        }
    };
    return Program;
}());
export { Program };
