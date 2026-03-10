import { FontParserTTF } from "./FontParserTTF.js";
import { FontParserWOFF } from "./FontParserWOFF.js";
export declare class FontParser {
    static load(url: string): Promise<FontParserTTF | FontParserWOFF>;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): FontParserTTF | FontParserWOFF;
}
