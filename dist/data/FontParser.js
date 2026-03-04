import { ByteArray } from "../utils/ByteArray.js";
import { FontParserTTF } from "./FontParserTTF.js";
import { FontParserWOFF } from "./FontParserWOFF.js";
var FontParser = /** @class */ (function () {
    function FontParser() {
    }
    FontParser.load = function (url) {
        return fetch(url)
            .then(function (response) {
            if (!response.ok)
                throw new Error("HTTP error! Status: ".concat(response.status));
            return response.arrayBuffer();
        })
            .then(function (arrayBuffer) { return FontParser.fromArrayBuffer(arrayBuffer); });
    };
    FontParser.fromArrayBuffer = function (arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        if (bytes.length < 4)
            throw new Error("Invalid font buffer");
        var tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (tag === "wOFF") {
            return new FontParserWOFF(new ByteArray(bytes));
        }
        if (tag === "wOF2") {
            throw new Error("WOFF2 not supported yet");
        }
        return new FontParserTTF(new ByteArray(bytes));
    };
    return FontParser;
}());
export { FontParser };
