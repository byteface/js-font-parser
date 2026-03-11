import { Particle } from '../../dist/utils/Particle.js';
import { getFontList } from '../../tools/shared/font-catalog.js';

const FontParser = window.FontParser?.FontParser;
const canvas = document.getElementById('myDrawing');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const scatterInput = document.getElementById('scatterInput');
const springInput = document.getElementById('springInput');
const gravInput = document.getElementById('gravInput');
const mousePullInput = document.getElementById('mousePullInput');
const mouseRepelInput = document.getElementById('mouseRepelInput');
const wanderInput = document.getElementById('wanderInput');
const speedInput = document.getElementById('speedInput');
const trailInput = document.getElementById('trailInput');
const connectInput = document.getElementById('connectInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');
const panel = document.querySelector('.ui');
const togglePanelButton = document.getElementById('togglePanelButton');
const randomizeButton = document.getElementById('randomizeButton');

const fonts = getFontList('demoCore').filter((entry) => !/2006 Team/i.test(entry.name));
const fontCache = new Map();
let font = null;
let particles = [];
let lastTime = performance.now();
let mouse = { x: 0, y: 0, active: false };

for (const entry of fonts) {
  const option = document.createElement('option');
  option.value = entry.url.startsWith('../') ? `../${entry.url}` : entry.url;
  option.textContent = entry.name;
  fontSelect.appendChild(option);
}
const defaultFont = fonts.find((entry) => /Quill/i.test(entry.name))?.url || fonts[0]?.url || '';
fontSelect.value = defaultFont.startsWith('../') ? `../${defaultFont}` : defaultFont;

function randomBetween(min, max, step = 1) {
  const value = min + Math.random() * (max - min);
  if (step === 1) return Math.round(value);
  return Math.round(value / step) * step;
}

function randomizeControls() {
  scaleInput.value = String(randomBetween(18, 30));
  scatterInput.value = String(randomBetween(12, 72));
  springInput.value = String(randomBetween(8, 20));
  gravInput.value = String(randomBetween(-6, 8));
  mousePullInput.value = String(randomBetween(10, 34));
  mouseRepelInput.value = String(randomBetween(50, 150));
  wanderInput.value = String(randomBetween(4, 14));
  speedInput.value = String(randomBetween(10, 24));
  trailInput.value = String(randomBetween(8, 20));
  connectInput.value = String(randomBetween(60, 120));
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rebuild();
}

function buildParticles(font, text) {
  const result = [];
  const scale = Number(scaleInput.value) * 0.01;
  const scatter = Number(scatterInput.value);
  const chars = Array.from((text || 'Q').slice(0, 8));
  let penX = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const runs = [];

  for (const ch of chars) {
    const glyph = font.getGlyphByChar(ch);
    if (!glyph) continue;
    runs.push({ glyph, penX });
    for (let i = 0; i < glyph.getPointCount(); i++) {
      const point = glyph.getPoint(i);
      const x = penX + point.x * scale;
      const y = -point.y * scale;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    penX += (glyph.advanceWidth || 0) * scale + 16;
  }

  if (!runs.length) return result;

  const centerOffsetX = -((minX + maxX) * 0.5);
  const centerOffsetY = -((minY + maxY) * 0.5);
  const originX = window.innerWidth * 0.55;
  const originY = window.innerHeight * 0.56;

  let index = 0;
  for (const run of runs) {
    for (let i = 0; i < run.glyph.getPointCount(); i++) {
      const point = run.glyph.getPoint(i);
      const homeX = originX + centerOffsetX + run.penX + point.x * scale;
      const homeY = originY + centerOffsetY - point.y * scale;
      const particle = new Particle();
      particle.x = homeX + (Math.random() - 0.5) * scatter;
      particle.y = homeY + (Math.random() - 0.5) * scatter;
      particle.width = 4;
      particle.height = 4;
      particle.vx = (Math.random() - 0.5) * 4;
      particle.vy = (Math.random() - 0.5) * 4;
      particle.damp = 0.92;
      particle.bounce = -0.7;
      particle.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
      particle.setEdgeBehavior('bounce');
      particle.turnToPath(true);
      particle.__springClips = [{ clip: { x: homeX, y: homeY }, k: Number(springInput.value) * 0.0014 }];
      particle.gravClips = [];
      particle.__repelClips = [];
      particle.gravToMouse = Number(mousePullInput.value) > 0;
      particle.gravMouseForce = Number(mousePullInput.value) * 180;
      particle.repelMouse = Number(mouseRepelInput.value) > 0;
      particle.repelMouseMinDist = Number(mouseRepelInput.value);
      particle.repelMouseK = 0.16;
      particle.maxSpeed = Number(speedInput.value);
      particle.wander = Number(wanderInput.value) * 0.02;
      particle.grav = Number(gravInput.value) * 0.01;
      particle.hue = 188 + (index % 34) * 2;
      particle.homeX = homeX;
      particle.homeY = homeY;
      result.push(particle);
      index++;
    }
  }

  particleChip.textContent = `${result.length} particles`;
  return result;
}

function updateParticleControls() {
  const spring = Number(springInput.value) * 0.0014;
  const mouseForce = Number(mousePullInput.value) * 180;
  const mouseRepel = Number(mouseRepelInput.value);
  const maxSpeed = Number(speedInput.value);
  const grav = Number(gravInput.value) * 0.01;
  const wander = Number(wanderInput.value) * 0.02;

  for (const p of particles) {
    p.__springClips = [{ clip: { x: p.homeX, y: p.homeY }, k: spring }];
    p.gravToMouse = mouseForce > 0;
    p.gravMouseForce = mouseForce;
    p.repelMouse = mouseRepel > 0;
    p.repelMouseMinDist = mouseRepel;
    p.maxSpeed = maxSpeed;
    p.grav = grav;
    p.wander = wander;
    p.xMouse = mouse.x;
    p.yMouse = mouse.y;
  }
}

function drawConnections() {
  const connectDist = Number(connectInput.value);
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < Math.min(i + 10, particles.length); j++) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > connectDist) continue;
      const alpha = 1 - dist / connectDist;
      ctx.strokeStyle = `hsla(${(a.hue + b.hue) * 0.5}, 100%, 74%, ${alpha * 0.16})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, 0.88)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
    ctx.fill();

    const tx = p.x - Math.cos(p.rotation || 0) * 7;
    const ty = p.y - Math.sin(p.rotation || 0) * 7;
    ctx.strokeStyle = `hsla(${(p.hue + 46) % 360}, 100%, 72%, 0.18)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

function animate(now) {
  const trail = Number(trailInput.value) / 100;
  ctx.fillStyle = `rgba(5, 9, 19, ${trail})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  updateParticleControls();
  drawConnections();
  for (const p of particles) {
    p.xMouse = mouse.x;
    p.yMouse = mouse.y;
    p.update();
  }
  drawParticles();
  lastTime = now;
  requestAnimationFrame(animate);
}

async function ensureFont() {
  const url = fontSelect.value;
  if (!fontCache.has(url)) {
    fontCache.set(url, FontParser.load(url));
  }
  font = await fontCache.get(url);
  fontChip.textContent = fontSelect.selectedOptions[0]?.textContent || 'font';
}

async function rebuild() {
  if (!FontParser || !fontSelect.value) return;
  await ensureFont();
  particles = buildParticles(font, textInput.value);
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  mouse.active = true;
});
canvas.addEventListener('mouseleave', () => {
  mouse.active = false;
});

fontSelect.addEventListener('change', rebuild);
textInput.addEventListener('input', rebuild);
scaleInput.addEventListener('input', rebuild);
scatterInput.addEventListener('input', rebuild);
springInput.addEventListener('input', updateParticleControls);
gravInput.addEventListener('input', updateParticleControls);
mousePullInput.addEventListener('input', updateParticleControls);
mouseRepelInput.addEventListener('input', updateParticleControls);
wanderInput.addEventListener('input', updateParticleControls);
speedInput.addEventListener('input', updateParticleControls);
window.addEventListener('resize', resize);
togglePanelButton?.addEventListener('click', () => {
  panel?.classList.toggle('collapsed');
  togglePanelButton.textContent = panel?.classList.contains('collapsed') ? 'Show' : 'Hide';
});
randomizeButton?.addEventListener('click', () => {
  randomizeControls();
  rebuild();
});

randomizeControls();
resize();
requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(animate);
});
