import { FontParserTTF } from './FontParserTTF.js';
export declare class FontParserWOFF2 {
    static load(url: string): Promise<FontParserTTF>;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): FontParserTTF;
}
