import { ByteArray } from '../utils/ByteArray.js';
import { decodeWoff2 } from '../utils/Woff2Decoder.js';
import { FontParserTTF } from './FontParserTTF.js';
export class FontParserWOFF2 {
    static async load(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        return this.fromArrayBuffer(buffer);
    }
    static fromArrayBuffer(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        const decoded = decodeWoff2(bytes);
        return new FontParserTTF(new ByteArray(decoded));
    }
}
