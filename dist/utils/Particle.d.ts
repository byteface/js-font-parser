interface Point {
    x: number;
    y: number;
    k?: number;
    force?: number;
    minDist?: number;
}
export declare class Particle {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    xMouse: number;
    yMouse: number;
    vx: number;
    vy: number;
    damp: number;
    bounce: number;
    grav: number;
    maxSpeed: number | null;
    wander: number;
    private __k;
    private __bounds;
    private __draggable;
    private __edgeBehavior;
    private __drag;
    private __oldx;
    private __oldy;
    private __turnToPath;
    private __springToMouse;
    private __mouseK;
    fixedPointX: number;
    fixedPointY: number;
    fixedPoint: boolean;
    fixedPointForce: number;
    gravToMouse: boolean;
    gravMouseForce: number;
    repelMouse: boolean;
    repelMouseMinDist: number;
    repelMouseK: number;
    private __springPoints;
    gravPoints: Point[];
    private __repelPoints;
    private __springClips;
    gravClips: Array<Point | {
        clip: Point;
        force: number;
    }>;
    private __repelClips;
    constructor();
    setBounds(oBounds: {
        xMin: number;
        yMin: number;
        yMax: number;
        xMax: number;
    }): void;
    setEdgeBehavior(sEdgeBehavior: string): void;
    getEdgeBehavior(): string;
    draggable(): boolean;
    turnToPath(bTurn: boolean): void;
    update(): void;
    private handleEdgeBehavior;
}
export {};
