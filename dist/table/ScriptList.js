import { Script } from "./Script.js";
import { ScriptRecord } from "./ScriptRecord.js";
var ScriptList = /** @class */ (function () {
    function ScriptList(byte_ar, offset) {
        this.scriptByTag = new Map();
        byte_ar.offset = offset;
        this.scriptCount = byte_ar.readUnsignedShort();
        this.scriptRecords = new Array(this.scriptCount);
        this.scripts = new Array(this.scriptCount);
        for (var i = 0; i < this.scriptCount; i++) {
            this.scriptRecords[i] = new ScriptRecord(byte_ar);
        }
        for (var j = 0; j < this.scriptCount; j++) {
            var script = new Script(byte_ar, offset + this.scriptRecords[j].offset);
            this.scripts[j] = script;
            this.scriptByTag.set(this.scriptRecords[j].tag, script);
        }
    }
    ScriptList.prototype.getScriptRecord = function (i) {
        return this.scriptRecords[i];
    };
    ScriptList.prototype.getScriptRecords = function () {
        return this.scriptRecords;
    };
    ScriptList.prototype.findScript = function (tag) {
        var _a;
        if (tag.length !== 4) {
            return null;
        }
        var tagVal = (tag.charCodeAt(0) << 24) |
            (tag.charCodeAt(1) << 16) |
            (tag.charCodeAt(2) << 8) |
            tag.charCodeAt(3);
        return (_a = this.scriptByTag.get(tagVal)) !== null && _a !== void 0 ? _a : null;
    };
    return ScriptList;
}());
export { ScriptList };
