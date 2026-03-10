export type Woff2DecodeFn = (data: Uint8Array) => Uint8Array;
export declare function setWoff2Decoder(fn: Woff2DecodeFn | null): void;
export declare function decodeWoff2(data: Uint8Array): Uint8Array;
