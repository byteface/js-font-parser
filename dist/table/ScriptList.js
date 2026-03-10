import { Script } from "./Script.js";
import { ScriptRecord } from "./ScriptRecord.js";
export class ScriptList {
    scriptCount;
    scriptRecords;
    scripts;
    scriptByTag = new Map();
    constructor(byte_ar, offset) {
        byte_ar.offset = offset;
        this.scriptCount = byte_ar.readUnsignedShort();
        this.scriptRecords = new Array(this.scriptCount);
        this.scripts = new Array(this.scriptCount);
        for (let i = 0; i < this.scriptCount; i++) {
            this.scriptRecords[i] = new ScriptRecord(byte_ar);
        }
        for (let j = 0; j < this.scriptCount; j++) {
            const script = new Script(byte_ar, offset + this.scriptRecords[j].offset);
            this.scripts[j] = script;
            this.scriptByTag.set(this.scriptRecords[j].tag, script);
        }
    }
    getScriptRecord(i) {
        return this.scriptRecords[i];
    }
    getScriptRecords() {
        return this.scriptRecords;
    }
    findScript(tag) {
        if (tag.length !== 4) {
            return null;
        }
        const tagVal = (tag.charCodeAt(0) << 24) |
            (tag.charCodeAt(1) << 16) |
            (tag.charCodeAt(2) << 8) |
            tag.charCodeAt(3);
        return this.scriptByTag.get(tagVal) ?? null;
    }
}
