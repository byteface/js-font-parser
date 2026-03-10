export class Debug {
    static enabled = false;
    static log(...args) {
        if (!Debug.enabled)
            return;
        // eslint-disable-next-line no-console
        console.log(...args);
    }
    static table(...args) {
        if (!Debug.enabled)
            return;
        // eslint-disable-next-line no-console
        console.table(...args);
    }
    static warn(...args) {
        if (!Debug.enabled)
            return;
        // eslint-disable-next-line no-console
        console.warn(...args);
    }
}
