"use strict";
var Particle = /** @class */ (function () {
    function Particle() {
        // Properties
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.rotation = 0; // radians
        this.xMouse = 0;
        this.yMouse = 0;
        this.vx = 0;
        this.vy = 0;
        this.damp = 0.9;
        this.bounce = -0.5;
        this.grav = 0;
        this.maxSpeed = null;
        this.wander = 0;
        this.__k = 0.2;
        this.__bounds = null;
        this.__draggable = false;
        this.__edgeBehavior = "bounce";
        this.__drag = false;
        this.__oldx = null;
        this.__oldy = null;
        this.__turnToPath = false;
        this.__springToMouse = false;
        this.__mouseK = 0.2;
        this.fixedPointX = 0;
        this.fixedPointY = 0;
        this.fixedPoint = false;
        this.fixedPointForce = 5000;
        this.gravToMouse = false;
        this.gravMouseForce = 5000;
        this.repelMouse = false;
        this.repelMouseMinDist = 100;
        this.repelMouseK = 0.2;
        this.__springPoints = [];
        this.gravPoints = [];
        this.__repelPoints = [];
        this.__springClips = [];
        this.gravClips = [];
        this.__repelClips = [];
        this.__bounds = {
            top: 0,
            bottom: 2000,
            left: 0,
            right: 2000,
        };
        this.maxSpeed = Number.MAX_VALUE;
    }
    Particle.prototype.setBounds = function (oBounds) {
        if (this.__bounds) {
            this.__bounds.top = oBounds.yMin;
            this.__bounds.bottom = oBounds.yMax;
            this.__bounds.left = oBounds.xMin;
            this.__bounds.right = oBounds.xMax;
        }
    };
    Particle.prototype.setEdgeBehavior = function (sEdgeBehavior) {
        this.__edgeBehavior = sEdgeBehavior;
    };
    Particle.prototype.getEdgeBehavior = function () {
        return this.__edgeBehavior;
    };
    Particle.prototype.draggable = function () {
        return this.__draggable;
    };
    Particle.prototype.turnToPath = function (bTurn) {
        this.__turnToPath = bTurn;
    };
    Particle.prototype.update = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        var dx;
        var dy;
        var distSQ;
        var dist;
        var force;
        var tx;
        var ty;
        var point;
        var clip;
        var k;
        var minDist;
        if (this.__drag) {
            this.vx = this.x - ((_a = this.__oldx) !== null && _a !== void 0 ? _a : this.x);
            this.vy = this.y - ((_b = this.__oldy) !== null && _b !== void 0 ? _b : this.y);
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
            for (var _i = 0, _l = this.__springPoints; _i < _l.length; _i++) {
                var sp = _l[_i];
                this.vx += (sp.x - this.x) * ((_c = sp.k) !== null && _c !== void 0 ? _c : 1);
                this.vy += (sp.y - this.y) * ((_d = sp.k) !== null && _d !== void 0 ? _d : 1);
            }
            for (var _m = 0, _o = this.gravPoints; _m < _o.length; _m++) {
                var gp = _o[_m];
                dx = gp.x - this.x;
                dy = gp.y - this.y;
                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);
                force = (_e = gp.force) !== null && _e !== void 0 ? _e : 0 / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }
            for (var _p = 0, _q = this.__repelPoints; _p < _q.length; _p++) {
                var rp = _q[_p];
                dx = rp.x - this.x;
                dy = rp.y - this.y;
                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < ((_f = rp.minDist) !== null && _f !== void 0 ? _f : 0)) {
                    tx = rp.x - ((_g = rp.minDist) !== null && _g !== void 0 ? _g : 0) * dx / dist;
                    ty = rp.y - ((_h = rp.minDist) !== null && _h !== void 0 ? _h : 0) * dy / dist;
                    this.vx += (tx - this.x) * ((_j = rp.k) !== null && _j !== void 0 ? _j : 1);
                    this.vy += (ty - this.y) * ((_k = rp.k) !== null && _k !== void 0 ? _k : 1);
                }
            }
            for (var _r = 0, _s = this.__springClips; _r < _s.length; _r++) {
                var sc = _s[_r];
                clip = sc.clip;
                k = sc.k;
                this.vx += (clip.x - this.x) * k;
                this.vy += (clip.y - this.y) * k;
            }
            for (var _t = 0, _u = this.gravClips; _t < _u.length; _t++) {
                var gc_1 = _u[_t];
                clip = gc_1.clip;
                dx = clip.x - this.x;
                dy = clip.y - this.y;
                distSQ = dx * dx + dy * dy;
                dist = Math.sqrt(distSQ);
                force = gc_1.force / distSQ;
                this.vx += force * dx / dist;
                this.vy += force * dy / dist;
            }
            for (var _v = 0, _w = this.__repelClips; _v < _w.length; _v++) {
                var rc = _w[_v];
                clip = rc.clip;
                minDist = rc.minDist;
                k = rc.k;
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
            var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
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
    };
    Particle.prototype.handleEdgeBehavior = function () {
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
    };
    return Particle;
}());
