import { ByteArray } from "../utils/ByteArray.js";
import { Script } from "./Script.js";
import { ScriptRecord } from "./ScriptRecord.js";
export declare class ScriptList {
    scriptCount: number;
    scriptRecords: ScriptRecord[];
    scripts: Script[];
    private scriptByTag;
    constructor(byte_ar: ByteArray, offset: number);
    getScriptRecord(i: number): ScriptRecord;
    getScriptRecords(): ScriptRecord[];
    findScript(tag: string): Script | null;
}
