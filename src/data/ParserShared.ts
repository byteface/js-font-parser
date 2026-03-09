import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';

export type CmapFormatLike = {
    format?: number;
    getFormatType?: () => number;
    getGlyphIndex?: (codePoint: number) => number | null;
    mapCharCode?: (codePoint: number) => number | null;
};

export type CmapLike = {
    formats: CmapFormatLike[];
    getCmapFormats: (platformId: number, encodingId: number) => CmapFormatLike[];
};

export type DiagnosticState = {
    diagnostics: FontDiagnostic[];
    diagnosticKeys: Set<string>;
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
    if (onceKey) {
        if (state.diagnosticKeys.has(onceKey)) return;
        state.diagnosticKeys.add(onceKey);
    }
    state.diagnostics.push({ code, level, phase, message, context });
}

export function getDiagnostics(state: DiagnosticState, filter?: DiagnosticFilter): FontDiagnostic[] {
    return state.diagnostics.filter((d) => matchesDiagnosticFilter(d, filter)).slice();
}

export function clearDiagnostics(state: DiagnosticState): void {
    state.diagnostics = [];
    state.diagnosticKeys.clear();
}

export function pickBestCmapFormat(formats: CmapFormatLike[], order: number[] = [4, 12, 10, 8, 6, 2, 0]): CmapFormatLike | null {
    if (formats.length === 0) return null;
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
            return pickBestCmapFormat(formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0]);
        }
    }

    return cmap.formats.length > 0
        ? pickBestCmapFormat(cmap.formats, prefersUcs4 ? [12, 10, 8, 4, 6, 2, 0] : [4, 12, 10, 8, 6, 2, 0])
        : null;
}
