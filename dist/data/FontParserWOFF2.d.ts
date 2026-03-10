import { FontParserTTF } from './FontParserTTF.js';
export declare class FontParserWOFF2 {
    static load(url: string): Promise<FontParserTTF>;
    static fromArrayBufferAsync(arrayBuffer: ArrayBuffer): Promise<FontParserTTF>;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): FontParserTTF;
}
