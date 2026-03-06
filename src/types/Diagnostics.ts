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

export function matchesDiagnosticFilter(diagnostic: Diagnostic, filter?: DiagnosticFilter): boolean {
    if (!filter) return true;
    if (filter.level && diagnostic.level !== filter.level) return false;
    if (filter.phase && diagnostic.phase !== filter.phase) return false;
    if (filter.code != null) {
        if (typeof filter.code === 'string') {
            if (diagnostic.code !== filter.code) return false;
        } else if (!filter.code.test(diagnostic.code)) {
            return false;
        }
    }
    return true;
}
