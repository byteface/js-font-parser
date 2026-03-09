export function matchesDiagnosticFilter(diagnostic, filter) {
    if (!filter)
        return true;
    if (filter.level && diagnostic.level !== filter.level)
        return false;
    if (filter.phase && diagnostic.phase !== filter.phase)
        return false;
    if (filter.code != null) {
        if (typeof filter.code === 'string') {
            if (diagnostic.code !== filter.code)
                return false;
        }
        else if (!filter.code.test(diagnostic.code)) {
            return false;
        }
    }
    return true;
}
