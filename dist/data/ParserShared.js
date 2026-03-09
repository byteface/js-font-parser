import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
export function emitDiagnostic(state, code, level, phase, message, context, onceKey) {
    if (onceKey) {
        if (state.diagnosticKeys.has(onceKey))
            return;
        state.diagnosticKeys.add(onceKey);
    }
    state.diagnostics.push({ code: code, level: level, phase: phase, message: message, context: context });
}
export function getDiagnostics(state, filter) {
    return state.diagnostics.filter(function (d) { return matchesDiagnosticFilter(d, filter); }).slice();
}
export function clearDiagnostics(state) {
    state.diagnostics = [];
    state.diagnosticKeys.clear();
}
export function pickBestCmapFormat(formats, order) {
    if (order === void 0) { order = [4, 12, 10, 8, 6, 2, 0]; }
    if (formats.length === 0)
        return null;
    var _loop_1 = function (fmt) {
        var found = formats.find(function (f) { return (typeof f.getFormatType === 'function' ? f.getFormatType() : f.format) === fmt; });
        if (found)
            return { value: found };
    };
    for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
        var fmt = order_1[_i];
        var state_1 = _loop_1(fmt);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return formats[0];
}
export function getBestCmapFormatFor(cmap, codePoint) {
    if (!cmap)
        return null;
    var prefersUcs4 = codePoint > 0xffff;
    var preferred = prefersUcs4
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
    for (var _i = 0, preferred_1 = preferred; _i < preferred_1.length; _i++) {
        var pref = preferred_1[_i];
        var formats = cmap.getCmapFormats(pref.platformId, pref.encodingId);
        if (formats.length > 0) {
            return pickBestCmapFormat(formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0]);
        }
    }
    return cmap.formats.length > 0
        ? pickBestCmapFormat(cmap.formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0])
        : null;
}
