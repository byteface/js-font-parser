let decoder = null;
export function setWoff2Decoder(fn) {
    decoder = fn;
}
function getOptionalNodeRequire() {
    try {
        return Function('return typeof require !== "undefined" ? require : null;')();
    }
    catch {
        return null;
    }
}
export function decodeWoff2(data) {
    if (decoder)
        return decoder(data);
    const globalAny = globalThis;
    if (globalAny?.WOFF2 && typeof globalAny.WOFF2.decode === 'function') {
        return globalAny.WOFF2.decode(data);
    }
    if (globalAny?.Woff2Decoder && typeof globalAny.Woff2Decoder.decode === 'function') {
        return globalAny.Woff2Decoder.decode(data);
    }
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
    throw new Error('WOFF2 decoder not available. Provide one via setWoff2Decoder() or global WOFF2.decode().');
}
