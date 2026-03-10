import { ByteArray } from '../utils/ByteArray.js';
import { decodeWoff2, decodeWoff2Async } from '../utils/Woff2Decoder.js';
import { FontParserTTF } from './FontParserTTF.js';

export class FontParserWOFF2 {
    static async load(url: string): Promise<FontParserTTF> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        return this.fromArrayBufferAsync(buffer);
    }

    static async fromArrayBufferAsync(arrayBuffer: ArrayBuffer): Promise<FontParserTTF> {
        const bytes = new Uint8Array(arrayBuffer);
        const decoded = await decodeWoff2Async(bytes);
        return new FontParserTTF(new ByteArray(decoded));
    }

    static fromArrayBuffer(arrayBuffer: ArrayBuffer): FontParserTTF {
        const bytes = new Uint8Array(arrayBuffer);
        const decoded = decodeWoff2(bytes);
        return new FontParserTTF(new ByteArray(decoded));
    }
}
