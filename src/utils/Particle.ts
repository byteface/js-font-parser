interface Bounds {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

interface Point {
    x: number;
    y: number;
    k?: number;        // Optional, used in springs
    force?: number;    // Optional, used in gravitational forces
    minDist?: number;  // Optional, used in repel forces
}

interface Clip {
    clip: Point;       // The point to which the clip refers
    k: number;         // The spring constant or strength
}

interface GravClip {
    clip: Point;       // The gravitational point
    force: number;     // The gravitational force applied
}

interface RepelClip {
    clip: Point;       // The point from which it repels
    minDist: number;   // Minimum distance for repelling
    k: number;         // The repulsion strength
}

class Particle {
    // Properties
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    rotation: number = 0; // radians

    xMouse: number = 0;
    yMouse: number = 0;

    vx: number = 0;
    vy: number = 0;
    damp: number = 0.9;
    bounce: number = -0.5;
    grav: number = 0;
    maxSpeed: number | null = null;
    wander: number = 0;

    private __k: number = 0.2;

    private __bounds: Bounds | null = null;
    private __draggable: boolean = false;
    private __edgeBehavior: string = "bounce";
    private __drag: boolean = false;
    private __oldx: number | null = null;
    private __oldy: number | null = null;

    private __turnToPath: boolean = false;
    private __springToMouse: boolean = false;

    private __mouseK: number = 0.2;

    fixedPointX: number = 0;
    fixedPointY: number = 0;
    fixedPoint: boolean = false;
    fixedPointForce: number = 5000;

    gravToMouse: boolean = false;
    gravMouseForce: number = 5000;

    repelMouse: boolean = false;
    repelMouseMinDist: number = 100;

    repelMouseK: number = 0.2;
    private __springPoints: Point[] = [];
    gravPoints: Point[] = [];
    private __repelPoints: Point[] = [];
    private __springClips: Array<Point | { clip: Point; k: number }> = [];
    gravClips: Array<Point | { clip: Point; force: number }> = [];
    private __repelClips: Array<Point | { clip: Point; minDist: number; k: number }> = [];

    constructor() {
        this.__bounds = {
            top: 0,
            bottom: 2000,
            left: 0,
            right: 2000,
        };
        this.maxSpeed = Number.MAX_VALUE;
    }

    setBounds(oBounds: { xMin: number; yMin: number; yMax: number; xMax: number }) {
        if (this.__bounds) {
            this.__bounds.top = oBounds.yMin;
            this.__bounds.bottom = oBounds.yMax;
            this.__bounds.left = oBounds.xMin;
            this.__bounds.right = oBounds.xMax;
        }
    }

    setEdgeBehavior(sEdgeBehavior: string) {
        this.__edgeBehavior = sEdgeBehavior;
    }

    getEdgeBehavior() {
        return this.__edgeBehavior;
    }

    draggable() {
        return this.__draggable;
    }

    turnToPath(bTurn: boolean) {
        this.__turnToPath = bTurn;
    }

    update() {
        let dx: number;
        let dy: number;
        let distSQ: number;
        let dist: number;
        let force: number;
        let tx: number;
        let ty: number;
        let point: Point;
        let clip: Point;
        let k: number;
        let minDist: number;

        if (this.__drag) {
            this.vx = this.x - (this.__oldx ?? this.x);
            this.vy = this.y - (this.__oldy ?? this.y);
            this.__oldx = this.x;
            this.__oldy = this.y;
        } else {
            // if (this.__springToMouse) {
            //     this.vx += (stage.mouseX - this.x) * this.__mouseK;
            //     this.vy += (stage.mouseY - this.y) * this.__mouseK;
            // }

            if (this.gravToMouse) {
                dx = this.xMouse - this.x;
                dy = this.yMouse - this.y;

                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);
                force = this.gravMouseForce / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }

            if (this.repelMouse) {
                dx = this.xMouse - this.x;
                dy = this.yMouse - this.y;

                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.repelMouseMinDist) {
                    tx = this.xMouse - this.repelMouseMinDist * dx / dist;
                    ty = this.yMouse - this.repelMouseMinDist * dy / dist;
                    this.vx += (tx - this.x) * this.repelMouseK;
                    this.vy += (ty - this.y) * this.repelMouseK;
                }
            }

            for (const sp of this.__springPoints) {
                this.vx += (sp.x - this.x) * (sp.k ?? 1);
                this.vy += (sp.y - this.y) * (sp.k ?? 1);
            }

            for (const gp of this.gravPoints) {
                dx = gp.x - this.x;
                dy = gp.y - this.y;

                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);

                force = gp.force ?? 0 / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }

            for (const rp of this.__repelPoints) {
                dx = rp.x - this.x;
                dy = rp.y - this.y;

                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (rp.minDist ?? 0)) {
                    tx = rp.x - (rp.minDist ?? 0) * dx / dist;
                    ty = rp.y - (rp.minDist ?? 0) * dy / dist;

                    this.vx += (tx - this.x) * (rp.k ?? 1);
                    this.vy += (ty - this.y) * (rp.k ?? 1);
                }
            }

            for (const sc of this.__springClips) {
                const scAny = sc as any;
                clip = (scAny.clip ?? scAny) as Point;
                k = scAny.k ?? this.__k;
                this.vx += (clip.x - this.x) * k;
                this.vy += (clip.y - this.y) * k;
            }

            for (const gc of this.gravClips) {
                const gcAny = gc as any;
                clip = (gcAny.clip ?? gcAny) as Point;
                dx = clip.x - this.x;
                dy = clip.y - this.y;

                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);
                force = (gcAny.force ?? 0) / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }

            for (const rc of this.__repelClips) {
                const rcAny = rc as any;
                clip = (rcAny.clip ?? rcAny) as Point;
                minDist = rcAny.minDist ?? 0;
                k = rcAny.k ?? this.repelMouseK;
                dx = clip.x - this.x;
                dy = clip.y - this.y;

                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    tx = clip.x - minDist * dx / dist;
                    ty = clip.y - minDist * dy / dist;
                    this.vx += (tx - this.x) * k;
                    this.vy += (ty - this.y) * k;
                }
            }

            this.vx += Math.random() * this.wander - this.wander / 2;
            this.vy += Math.random() * this.wander - this.wander / 2;

            this.vy += this.grav;
            this.vx *= this.damp;
            this.vy *= this.damp;

            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > this.maxSpeed!) {
                this.vx = this.maxSpeed! * this.vx / speed;
                this.vy = this.maxSpeed! * this.vy / speed;
            }

            if (this.__turnToPath) {
                this.rotation = Math.atan2(this.vy, this.vx);
            }

            this.x += this.vx;
            this.y += this.vy;

            this.handleEdgeBehavior();
        }
    }

    private handleEdgeBehavior() {
        if (this.__edgeBehavior === "wrap") {
            if (this.x > this.__bounds!.right + this.width / 2) {
                this.x = this.__bounds!.left - this.width / 2;
            } else if (this.x < this.__bounds!.left - this.width / 2) {
                this.x = this.__bounds!.right + this.width / 2;
            }
            if (this.y > this.__bounds!.bottom + this.height / 2) {
                this.y = this.__bounds!.top - this.height / 2;
            } else if (this.y < this.__bounds!.top - this.height / 2) {
                this.y = this.__bounds!.bottom + this.height / 2;
            }
        } else if (this.__edgeBehavior === "bounce") {
            if (this.x > this.__bounds!.right + this.width / 2) {
                this.x = this.__bounds!.right + this.width / 2;
                this.vx *= this.bounce;
            } else if (this.x < this.__bounds!.left - this.width / 2) {
                this.x = this.__bounds!.left - this.width / 2;
                this.vx *= this.bounce;
            }
            if (this.y > this.__bounds!.bottom + this.height / 2) {
                this.y = this.__bounds!.bottom + this.height / 2;
                this.vy *= this.bounce;
            } else if (this.y < this.__bounds!.top - this.height / 2) {
                this.y = this.__bounds!.top - this.height / 2;
                this.vy *= this.bounce;
            }
        }
    }
}
