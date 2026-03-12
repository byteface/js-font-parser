export class Debug {
    static enabled: boolean = false;

    static log(...args: any[]): void {
        if (!Debug.enabled) return;
        console.log(...args);
    }

    static table(...args: any[]): void {
        if (!Debug.enabled) return;
        console.table(...args);
    }

    static warn(...args: any[]): void {
        if (!Debug.enabled) return;
        console.warn(...args);
    }
}
