import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
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
export declare function emitDiagnostic(state: DiagnosticState, code: string, level: 'warning' | 'info', phase: 'parse' | 'layout', message: string, context?: Record<string, unknown>, onceKey?: string): void;
export declare function getDiagnostics(state: DiagnosticState, filter?: DiagnosticFilter): FontDiagnostic[];
export declare function clearDiagnostics(state: DiagnosticState): void;
export declare function pickBestCmapFormat(formats: CmapFormatLike[], order?: number[]): CmapFormatLike | null;
export declare function getBestCmapFormatFor(cmap: CmapLike | null, codePoint: number): CmapFormatLike | null;
