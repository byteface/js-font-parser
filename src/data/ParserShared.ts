import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';

export type CmapFormatLike = {
    format?: number;
    getFormatType?: () => number;
};

export type CmapLike = {
    formats: CmapFormatLike[];
    getCmapFormats: (platformId: number, encodingId: number) => CmapFormatLike[];
};

export type DiagnosticState = {
    diagnostics?: FontDiagnostic[];
    diagnosticKeys?: Set<string>;
};

export function emitDiagnostic(
    state: DiagnosticState,
    code: string,
    level: 'warning' | 'info',
    phase: 'parse' | 'layout',
    message: string,
    context?: Record<string, unknown>,
    onceKey?: string
): void {
    if (!Array.isArray(state.diagnostics)) state.diagnostics = [];
    if (!(state.diagnosticKeys instanceof Set)) state.diagnosticKeys = new Set<string>();
    if (onceKey) {
        if (state.diagnosticKeys.has(onceKey)) return;
        state.diagnosticKeys.add(onceKey);
    }
    state.diagnostics.push({ code, level, phase, message, context });
}

export function getDiagnostics(state: DiagnosticState, filter?: DiagnosticFilter): FontDiagnostic[] {
    if (!Array.isArray(state.diagnostics)) state.diagnostics = [];
    return state.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
}

export function clearDiagnostics(state: DiagnosticState): void {
    state.diagnostics = [];
    if (!(state.diagnosticKeys instanceof Set)) state.diagnosticKeys = new Set<string>();
    state.diagnosticKeys.clear();
}

export function pickBestCmapFormat(formats: CmapFormatLike[]): CmapFormatLike | null {
    if (formats.length === 0) return null;
    const order = [4, 12, 10, 8, 6, 2, 0];
    for (const fmt of order) {
        const found = formats.find((f) => (typeof f.getFormatType === 'function' ? f.getFormatType() : f.format) === fmt);
        if (found) return found;
    }
    return formats[0];
}

export function getBestCmapFormatFor(cmap: CmapLike | null, codePoint: number): CmapFormatLike | null {
    if (!cmap) return null;

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
        const formats = cmap.getCmapFormats(pref.platformId, pref.encodingId);
        if (formats.length > 0) {
            return pickBestCmapFormat(formats);
        }
    }

    return cmap.formats.length > 0 ? pickBestCmapFormat(cmap.formats) : null;
}
