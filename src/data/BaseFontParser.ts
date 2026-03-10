import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import {
    clearDiagnostics as clearParserDiagnostics,
    emitDiagnostic as emitParserDiagnostic,
    getBestCmapFormatFor as selectBestCmapFormatFor,
    getDiagnostics as getParserDiagnostics,
    pickBestCmapFormat
} from './ParserShared.js';

type DiagnosticState = {
    diagnostics: FontDiagnostic[];
    diagnosticKeys: Set<string>;
};

export abstract class BaseFontParser {
    private diagnostics: FontDiagnostic[] = [];
    private diagnosticKeys = new Set<string>();

    protected emitDiagnostic(
        code: string,
        level: 'warning' | 'info',
        phase: 'parse' | 'layout',
        message: string,
        context?: Record<string, unknown>,
        onceKey?: string
    ): void {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        emitParserDiagnostic(state, code, level, phase, message, context, onceKey);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
    }

    public getDiagnostics(filter?: DiagnosticFilter): FontDiagnostic[] {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        const out = getParserDiagnostics(state, filter);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
        return out;
    }

    public clearDiagnostics(): void {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        clearParserDiagnostics(state);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
    }

    protected abstract getCmapTableForLookup(): any | null;

    protected getBestCmapFormatFor(codePoint: number): any | null {
        return selectBestCmapFormatFor(this.getCmapTableForLookup(), codePoint);
    }

    protected pickBestFormat(formats: any[]): any | null {
        return pickBestCmapFormat(formats as any);
    }
}
