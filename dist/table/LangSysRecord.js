var LangSysRecord = /** @class */ (function () {
    /** Creates a new LangSysRecord */
    function LangSysRecord(byte_ar) {
        this.tag = byte_ar.readInt();
        this.offset = byte_ar.readUnsignedShort();
    }
    LangSysRecord.prototype.getTag = function () {
        return this.tag;
    };
    LangSysRecord.prototype.getOffset = function () {
        return this.offset;
    };
    return LangSysRecord;
}());
export { LangSysRecord };
