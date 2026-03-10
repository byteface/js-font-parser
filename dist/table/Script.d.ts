import { ByteArray } from "../utils/ByteArray.js";
import { LangSysRecord } from "./LangSysRecord.js";
import { LangSys } from "./LangSys.js";
export declare class Script {
    defaultLangSysOffset: number;
    langSysCount: number;
    langSysRecords: LangSysRecord[];
    defaultLangSys: LangSys | null;
    langSys: LangSys[];
    constructor(byte_ar: ByteArray, offset: number);
    getDefaultLangSys(): LangSys | null;
    getFirstLangSys(): LangSys | null;
}
