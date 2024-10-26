import { LangSysRecord } from "./LangSysRecord.js";
import { LangSys } from "./LangSys.js";
var Script = /** @class */ (function () {
    function Script(byte_ar, offset) {
        byte_ar.offset = offset;
        this.defaultLangSysOffset = byte_ar.readUnsignedShort();
        this.langSysCount = byte_ar.readUnsignedShort();
        if (this.langSysCount > 0) {
            this.langSysRecords = new Array(this.langSysCount);
            for (var i = 0; i < this.langSysCount; i++) {
                this.langSysRecords[i] = new LangSysRecord(byte_ar);
            }
        }
        else {
            this.langSysRecords = null; // Explicitly set to null if no records
        }
        // Read the LangSys tables
        if (this.langSysCount > 0) {
            this.langSys = new Array(this.langSysCount);
            for (var j = 0; j < this.langSysCount; j++) {
                byte_ar.offset = offset + this.langSysRecords[j].getOffset();
                this.langSys[j] = new LangSys(byte_ar);
            }
        }
        else {
            this.langSys = null; // Explicitly set to null if no LangSys
        }
        if (this.defaultLangSysOffset > 0) {
            byte_ar.offset = offset + this.defaultLangSysOffset;
            this.defaultLangSys = new LangSys(byte_ar);
        }
        else {
            this.defaultLangSys = null; // Explicitly set to null if no default LangSys
        }
    }
    return Script;
}());
export { Script };
