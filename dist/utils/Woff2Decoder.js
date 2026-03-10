let decoder = null;
let decoderAsync = null;
export function setWoff2Decoder(fn) {
    decoder = fn;
}
export function setWoff2DecoderAsync(fn) {
    decoderAsync = fn;
}
function getOptionalNodeRequire() {
    try {
        return Function('return typeof require !== "undefined" ? require : null;')();
    }
    catch {
        return null;
    }
}
function resolveGlobalDecodeFn() {
    const globalAny = globalThis;
    if (globalAny?.WOFF2 && typeof globalAny.WOFF2.decode === 'function') {
        return globalAny.WOFF2.decode;
    }
    if (globalAny?.Woff2Decoder && typeof globalAny.Woff2Decoder.decode === 'function') {
        return globalAny.Woff2Decoder.decode;
    }
    return null;
}
function decodeWithOptionalNodePackage(data) {
    try {
        // Node-only: allow optional woff2 package if installed.
        const nodeRequire = getOptionalNodeRequire();
        const nodeDecoder = nodeRequire ? nodeRequire('woff2') : null;
        if (nodeDecoder && typeof nodeDecoder.decode === 'function') {
            return nodeDecoder.decode(data);
        }
        if (typeof nodeDecoder === 'function') {
            return nodeDecoder(data);
        }
    }
    catch {
        // ignore
    }
    return null;
}
export function decodeWoff2(data) {
    if (decoder)
        return decoder(data);
    const globalDecode = resolveGlobalDecodeFn();
    if (globalDecode) {
        return globalDecode(data);
    }
    const nodeDecoded = decodeWithOptionalNodePackage(data);
    if (nodeDecoded) {
        return nodeDecoded;
    }
    throw new Error('WOFF2 decoder not available. Provide one via setWoff2Decoder(), setWoff2DecoderAsync(), or global WOFF2.decode().');
}
export async function decodeWoff2Async(data) {
    if (decoderAsync) {
        const decoded = await decoderAsync(data);
        return decoded;
    }
    return decodeWoff2(data);
}
