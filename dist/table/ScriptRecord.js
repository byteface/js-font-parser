var ScriptRecord = /** @class */ (function () {
    function ScriptRecord(byte_ar) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
    return ScriptRecord;
}());
export { ScriptRecord };
