export type DiagnosticLevel = 'warning' | 'info';
export type DiagnosticPhase = 'parse' | 'layout' | 'render';
export type Diagnostic = {
    code: string;
    level: DiagnosticLevel;
    phase: DiagnosticPhase;
    message: string;
    context?: Record<string, unknown>;
};
export type DiagnosticFilter = {
    level?: DiagnosticLevel;
    phase?: DiagnosticPhase;
    code?: string | RegExp;
};
export declare function matchesDiagnosticFilter(diagnostic: Diagnostic, filter?: DiagnosticFilter): boolean;
