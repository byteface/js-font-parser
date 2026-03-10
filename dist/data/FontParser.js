import { ByteArray } from "../utils/ByteArray.js";
import { FontParserTTF } from "./FontParserTTF.js";
import { FontParserWOFF } from "./FontParserWOFF.js";
import { FontParserWOFF2 } from "./FontParserWOFF2.js";
export class FontParser {
    static async load(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return FontParser.fromArrayBuffer(arrayBuffer);
    }
    static fromArrayBuffer(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        if (bytes.length < 4)
            throw new Error("Invalid font buffer");
        const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (tag === "wOFF") {
            return new FontParserWOFF(new ByteArray(bytes));
        }
        if (tag === "wOF2") {
            return FontParserWOFF2.fromArrayBuffer(arrayBuffer);
        }
        return new FontParserTTF(new ByteArray(bytes));
    }
}
