export class Debug {
    static enabled = false;
    static log(...args) {
        if (!Debug.enabled)
            return;
        console.log(...args);
    }
    static table(...args) {
        if (!Debug.enabled)
            return;
        console.table(...args);
    }
    static warn(...args) {
        if (!Debug.enabled)
            return;
        console.warn(...args);
    }
}
