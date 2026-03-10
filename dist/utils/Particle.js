"use strict";
class Particle {
    // Properties
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    rotation = 0; // radians
    xMouse = 0;
    yMouse = 0;
    vx = 0;
    vy = 0;
    damp = 0.9;
    bounce = -0.5;
    grav = 0;
    maxSpeed = null;
    wander = 0;
    __k = 0.2;
    __bounds = null;
    __draggable = false;
    __edgeBehavior = "bounce";
    __drag = false;
    __oldx = null;
    __oldy = null;
    __turnToPath = false;
    __springToMouse = false;
    __mouseK = 0.2;
    fixedPointX = 0;
    fixedPointY = 0;
    fixedPoint = false;
    fixedPointForce = 5000;
    gravToMouse = false;
    gravMouseForce = 5000;
    repelMouse = false;
    repelMouseMinDist = 100;
    repelMouseK = 0.2;
    __springPoints = [];
    gravPoints = [];
    __repelPoints = [];
    __springClips = [];
    gravClips = [];
    __repelClips = [];
    constructor() {
        this.__bounds = {
            top: 0,
            bottom: 2000,
            left: 0,
            right: 2000,
        };
        this.maxSpeed = Number.MAX_VALUE;
    }
    setBounds(oBounds) {
        if (this.__bounds) {
            this.__bounds.top = oBounds.yMin;
            this.__bounds.bottom = oBounds.yMax;
            this.__bounds.left = oBounds.xMin;
            this.__bounds.right = oBounds.xMax;
        }
    }
    setEdgeBehavior(sEdgeBehavior) {
        this.__edgeBehavior = sEdgeBehavior;
    }
    getEdgeBehavior() {
        return this.__edgeBehavior;
    }
    draggable() {
        return this.__draggable;
    }
    turnToPath(bTurn) {
        this.__turnToPath = bTurn;
    }
    update() {
        let dx;
        let dy;
        let distSQ;
        let dist;
        let force;
        let tx;
        let ty;
        let point;
        let clip;
        let k;
        let minDist;
        if (this.__drag) {
            this.vx = this.x - (this.__oldx ?? this.x);
            this.vy = this.y - (this.__oldy ?? this.y);
            this.__oldx = this.x;
            this.__oldy = this.y;
        }
        else {
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
                const scAny = sc;
                clip = (scAny.clip ?? scAny);
                k = scAny.k ?? this.__k;
                this.vx += (clip.x - this.x) * k;
                this.vy += (clip.y - this.y) * k;
            }
            for (const gc of this.gravClips) {
                const gcAny = gc;
                clip = (gcAny.clip ?? gcAny);
                dx = clip.x - this.x;
                dy = clip.y - this.y;
                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);
                force = (gcAny.force ?? 0) / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }
            for (const rc of this.__repelClips) {
                const rcAny = rc;
                clip = (rcAny.clip ?? rcAny);
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
            if (speed > this.maxSpeed) {
                this.vx = this.maxSpeed * this.vx / speed;
                this.vy = this.maxSpeed * this.vy / speed;
            }
            if (this.__turnToPath) {
                this.rotation = Math.atan2(this.vy, this.vx);
            }
            this.x += this.vx;
            this.y += this.vy;
            this.handleEdgeBehavior();
        }
    }
    handleEdgeBehavior() {
        if (this.__edgeBehavior === "wrap") {
            if (this.x > this.__bounds.right + this.width / 2) {
                this.x = this.__bounds.left - this.width / 2;
            }
            else if (this.x < this.__bounds.left - this.width / 2) {
                this.x = this.__bounds.right + this.width / 2;
            }
            if (this.y > this.__bounds.bottom + this.height / 2) {
                this.y = this.__bounds.top - this.height / 2;
            }
            else if (this.y < this.__bounds.top - this.height / 2) {
                this.y = this.__bounds.bottom + this.height / 2;
            }
        }
        else if (this.__edgeBehavior === "bounce") {
            if (this.x > this.__bounds.right + this.width / 2) {
                this.x = this.__bounds.right + this.width / 2;
                this.vx *= this.bounce;
            }
            else if (this.x < this.__bounds.left - this.width / 2) {
                this.x = this.__bounds.left - this.width / 2;
                this.vx *= this.bounce;
            }
            if (this.y > this.__bounds.bottom + this.height / 2) {
                this.y = this.__bounds.bottom + this.height / 2;
                this.vy *= this.bounce;
            }
            else if (this.y < this.__bounds.top - this.height / 2) {
                this.y = this.__bounds.top - this.height / 2;
                this.vy *= this.bounce;
            }
        }
    }
}
