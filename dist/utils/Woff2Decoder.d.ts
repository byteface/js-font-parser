export type Woff2DecodeFn = (data: Uint8Array) => Uint8Array;
export type Woff2DecodeAsyncFn = (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;
export declare function setWoff2Decoder(fn: Woff2DecodeFn | null): void;
export declare function setWoff2DecoderAsync(fn: Woff2DecodeAsyncFn | null): void;
export declare function decodeWoff2(data: Uint8Array): Uint8Array;
export declare function decodeWoff2Async(data: Uint8Array): Promise<Uint8Array>;
