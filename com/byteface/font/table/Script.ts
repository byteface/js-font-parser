import { ByteArray } from "../utils/ByteArray.js";
import { LangSysRecord } from "./LangSysRecord.js";
import { LangSys } from "./LangSys.js";

export class Script {
    defaultLangSysOffset: number;
    langSysCount: number;
    langSysRecords: LangSysRecord[];
    defaultLangSys: LangSys | null;
    langSys: LangSys[];

    constructor(byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;

        this.defaultLangSysOffset = byte_ar.readUnsignedShort();
        this.langSysCount = byte_ar.readUnsignedShort();

        this.langSysRecords = [];
        if (this.langSysCount > 0) {
            this.langSysRecords = new Array(this.langSysCount);
            for (let i = 0; i < this.langSysCount; i++) {
                this.langSysRecords[i] = new LangSysRecord(byte_ar);
            }
        }

        // Read the LangSys tables
        this.langSys = [];
        if (this.langSysCount > 0) {
            this.langSys = new Array(this.langSysCount);
            for (let j = 0; j < this.langSysCount; j++) {
                byte_ar.offset = offset + this.langSysRecords[j].getOffset();
                this.langSys[j] = new LangSys(byte_ar);
            }
        }

        if (this.defaultLangSysOffset > 0) {
            byte_ar.offset = offset + this.defaultLangSysOffset;
            this.defaultLangSys = new LangSys(byte_ar);
        } else {
            this.defaultLangSys = null; // Explicitly set to null if no default LangSys
        }
    }
}
