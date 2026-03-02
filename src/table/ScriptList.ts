import { ByteArray } from "../utils/ByteArray.js";
import { Script } from "./Script.js";
import { ScriptRecord } from "./ScriptRecord.js";

export class ScriptList {
    scriptCount: number;
    scriptRecords: ScriptRecord[];
    scripts: Script[];

    constructor(byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;

        this.scriptCount = byte_ar.readUnsignedShort();
        this.scriptRecords = new Array(this.scriptCount);
        this.scripts = new Array(this.scriptCount);

        for (let i = 0; i < this.scriptCount; i++) {
            this.scriptRecords[i] = new ScriptRecord(byte_ar);
        }

        for (let j = 0; j < this.scriptCount; j++) {
            this.scripts[j] = new Script(byte_ar, offset + this.scriptRecords[j].offset);
        }
    }

    getScriptRecord(i: number): ScriptRecord {
        return this.scriptRecords[i];
    }

    getScriptRecords(): ScriptRecord[] {
        return this.scriptRecords;
    }

    findScript(tag: string): Script | null {
        if (tag.length !== 4) {
            return null;
        }

        const tagVal =
            (tag.charCodeAt(0) << 24) |
            (tag.charCodeAt(1) << 16) |
            (tag.charCodeAt(2) << 8) |
            tag.charCodeAt(3);

        for (let i = 0; i < this.scriptCount; i++) {
            if (this.scriptRecords[i].tag === tagVal) {
                return this.scripts[i];
            }
        }

        return null;
    }
}
