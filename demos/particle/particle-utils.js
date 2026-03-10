export function setupParticleDemo(config) {
    const FontParser = window.FontParser?.FontParser;
    if (!FontParser) {
        console.error('Particle demo requires ../dist-build/fontparser.min.js to be loaded first.');
        return;
    }
    const canvas = document.getElementById(config.canvasId || 'myDrawing');
    const ctx = canvas.getContext('2d');
    const state = {
        particles: [],
        mouse: { x: canvas.width / 2, y: canvas.height / 2, active: false }
    };

    if (config.gravToMouse) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            state.mouse.x = e.clientX - rect.left;
            state.mouse.y = e.clientY - rect.top;
            state.mouse.active = true;
        });
        canvas.addEventListener('mouseleave', () => {
            state.mouse.active = false;
        });
    }

    FontParser.load(config.fontUrl)
        .then((font) => {
            if (typeof config.text === 'string' && config.text.length > 0) {
                state.particles = buildParticlesFromText(font, config.text, {
                    scale: config.scale || 0.1,
                    originX: config.originX ?? canvas.width * 0.5,
                    originY: config.originY ?? canvas.height * 0.55,
                    center: config.center !== false,
                    letterSpacing: config.letterSpacing ?? 0,
                    jitter: config.jitter || 0,
                    maxParticles: config.maxParticles || 0
                });
            } else {
                let glyph = null;
                if (config.char) {
                    glyph = font.getGlyphByChar(config.char);
                } else if (typeof config.glyphIndex === 'number') {
                    glyph = font.getGlyph(config.glyphIndex);
                } else {
                    const idx = Math.floor(Math.random() * (config.randomGlyphMax || 50));
                    glyph = font.getGlyph(idx);
                }
                state.particles = buildParticlesFromGlyph(glyph, {
                    scale: config.scale || 0.1,
                    originX: config.originX || canvas.width * 0.2,
                    originY: config.originY || canvas.height * 0.6,
                    jitter: config.jitter || 0,
                    maxParticles: config.maxParticles || 0
                });
            }
            animate();
        })
        .catch((err) => console.error('Failed to load font', err));

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = config.color || '#ffffff';

        for (const p of state.particles) {
            applyForces(p, state, config, canvas);
            p.vx *= config.damp ?? 0.9;
            p.vy *= config.damp ?? 0.9;
            limitSpeed(p, config.maxSpeed ?? 20);
            p.x += p.vx;
            p.y += p.vy;
            handleEdges(p, config.edgeBehavior || 'bounce', canvas);

            ctx.fillRect(p.x, p.y, config.pointSize || 2, config.pointSize || 2);
        }

        if (!config.stopAfterMs) {
            requestAnimationFrame(animate);
        } else {
            // keep animating until stop time then freeze
            if (!state.startTime) state.startTime = performance.now();
            if (performance.now() - state.startTime < config.stopAfterMs) {
                requestAnimationFrame(animate);
            }
        }
    }
}

function buildParticlesFromGlyph(glyph, opts) {
    if (!glyph) return [];
    const particles = [];
    const count = glyph.getPointCount();
    const max = opts.maxParticles && opts.maxParticles > 0 ? Math.min(count, opts.maxParticles) : count;

    for (let i = 0; i < max; i++) {
        const p = glyph.getPoint(i);
        const x = opts.originX + p.x * opts.scale + (Math.random() - 0.5) * opts.jitter;
        const y = opts.originY - p.y * opts.scale + (Math.random() - 0.5) * opts.jitter;
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }

    return particles;
}

function buildParticlesFromText(font, text, opts) {
    const particles = [];
    const scale = opts.scale || 0.1;
    const letterSpacing = opts.letterSpacing || 0;
    const glyphRuns = [];
    let penX = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const ch of Array.from(text)) {
        const glyph = font.getGlyphByChar(ch);
        if (!glyph) {
            penX += letterSpacing;
            continue;
        }

        glyphRuns.push({ glyph, penX });
        for (let i = 0; i < glyph.getPointCount(); i++) {
            const p = glyph.getPoint(i);
            const gx = penX + p.x * scale;
            const gy = -p.y * scale;
            if (gx < minX) minX = gx;
            if (gy < minY) minY = gy;
            if (gx > maxX) maxX = gx;
            if (gy > maxY) maxY = gy;
        }
        penX += (glyph.advanceWidth || 0) * scale + letterSpacing;
    }

    if (!glyphRuns.length) return particles;

    const centerOffsetX = opts.center === false ? 0 : -((minX + maxX) * 0.5);
    const centerOffsetY = opts.center === false ? 0 : -((minY + maxY) * 0.5);
    const max = opts.maxParticles && opts.maxParticles > 0 ? opts.maxParticles : Infinity;

    for (const run of glyphRuns) {
        for (let i = 0; i < run.glyph.getPointCount(); i++) {
            if (particles.length >= max) return particles;
            const p = run.glyph.getPoint(i);
            const x = (opts.originX || 0) + centerOffsetX + run.penX + p.x * scale + (Math.random() - 0.5) * (opts.jitter || 0);
            const y = (opts.originY || 0) + centerOffsetY - p.y * scale + (Math.random() - 0.5) * (opts.jitter || 0);
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
    }

    return particles;
}

function applyForces(p, state, config, canvas) {
    if (config.wander) {
        p.vx += (Math.random() - 0.5) * config.wander;
        p.vy += (Math.random() - 0.5) * config.wander;
    }

    if (config.gravToMouse && state.mouse.active) {
        const dx = state.mouse.x - p.x;
        const dy = state.mouse.y - p.y;
        const dist = Math.max(20, Math.sqrt(dx * dx + dy * dy));
        const strength = (config.gravStrength || 1000) / dist;
        p.vx += (dx / dist) * strength * 0.01;
        p.vy += (dy / dist) * strength * 0.01;
    }
}

function limitSpeed(p, maxSpeed) {
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        p.vx *= scale;
        p.vy *= scale;
    }
}

function handleEdges(p, mode, canvas) {
    if (mode !== 'bounce') return;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
}
