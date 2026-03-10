import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
export function emitDiagnostic(state, code, level, phase, message, context, onceKey) {
    if (onceKey) {
        if (state.diagnosticKeys.has(onceKey))
            return;
        state.diagnosticKeys.add(onceKey);
    }
    state.diagnostics.push({ code, level, phase, message, context });
}
export function getDiagnostics(state, filter) {
    return state.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
}
export function clearDiagnostics(state) {
    state.diagnostics = [];
    state.diagnosticKeys.clear();
}
export function pickBestCmapFormat(formats, order = [4, 12, 10, 8, 6, 2, 0]) {
    if (formats.length === 0)
        return null;
    const safeFormats = formats.filter((f) => !!f && typeof f === 'object');
    if (safeFormats.length === 0)
        return null;
    for (const fmt of order) {
        const found = safeFormats.find((f) => (typeof f.getFormatType === 'function' ? f.getFormatType() : f.format) === fmt);
        if (found)
            return found;
    }
    return safeFormats[0];
}
export function getBestCmapFormatFor(cmap, codePoint) {
    if (!cmap)
        return null;
    const prefersUcs4 = codePoint > 0xffff;
    const preferred = prefersUcs4
        ? [
            { platformId: 3, encodingId: 10 },
            { platformId: 0, encodingId: 4 },
            { platformId: 3, encodingId: 1 },
            { platformId: 0, encodingId: 3 },
            { platformId: 0, encodingId: 1 },
            { platformId: 1, encodingId: 0 }
        ]
        : [
            { platformId: 3, encodingId: 1 },
            { platformId: 0, encodingId: 3 },
            { platformId: 0, encodingId: 1 },
            { platformId: 3, encodingId: 10 },
            { platformId: 0, encodingId: 4 },
            { platformId: 1, encodingId: 0 }
        ];
    for (const pref of preferred) {
        let formats = [];
        try {
            const resolved = cmap.getCmapFormats(pref.platformId, pref.encodingId);
            formats = Array.isArray(resolved) ? resolved : [];
        }
        catch {
            formats = [];
        }
        if (formats.length > 0) {
            return pickBestCmapFormat(formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0]);
        }
    }
    const fallbackFormats = Array.isArray(cmap.formats) ? cmap.formats : [];
    return fallbackFormats.length > 0
        ? pickBestCmapFormat(fallbackFormats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0])
        : null;
}
