export class Debug {
    static enabled: boolean = false;

    static log(...args: any[]): void {
        if (!Debug.enabled) return;
        // eslint-disable-next-line no-console
        console.log(...args);
    }

    static table(...args: any[]): void {
        if (!Debug.enabled) return;
        // eslint-disable-next-line no-console
        console.table(...args);
    }

    static warn(...args: any[]): void {
        if (!Debug.enabled) return;
        // eslint-disable-next-line no-console
        console.warn(...args);
    }
}
