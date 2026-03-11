import { Particle } from '../../dist/utils/Particle.js';
import { getFontList } from '../../tools/shared/font-catalog.js';
import { FontParser, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const scaleInput = document.getElementById('scaleInput');
const scatterInput = document.getElementById('scatterInput');
const burstInput = document.getElementById('burstInput');
const springInput = document.getElementById('springInput');
const wanderInput = document.getElementById('wanderInput');
const speedInput = document.getElementById('speedInput');
const trailInput = document.getElementById('trailInput');
const connectInput = document.getElementById('connectInput');
const glowInput = document.getElementById('glowInput');
const timeChip = document.getElementById('timeChip');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');
const panel = document.querySelector('.ui');
const togglePanelButton = document.getElementById('togglePanelButton');
const shuffleButton = document.getElementById('shuffleButton');

const fallbackFonts = [
  { name: 'DSEG7 Classic Mini Bold', url: '../../truetypefonts/curated-extra/DSEG7ClassicMini-Bold.ttf' },
  { name: 'Gotham Narrow Ultra (OTF)', url: '../../truetypefonts/GothamNarrow-Ultra.otf' },
  { name: 'Minecraft', url: '../../truetypefonts/Minecraft.ttf' },
  { name: 'Source Code Pro Bold (OTF)', url: '../../truetypefonts/curated-extra/SourceCodePro-Bold.otf' },
  { name: 'Roboto Variable', url: '../../truetypefonts/curated/Roboto-VF.ttf' }
];

function loadFontOptions() {
  try {
    return getFontList('digitalDisplay').map((entry) => ({
      name: entry.name,
      url: entry.url.startsWith('../') ? `../${entry.url}` : entry.url
    }));
  } catch (error) {
    console.warn('particle p27 falling back to inline font list:', error);
    return fallbackFonts;
  }
}

const fonts = loadFontOptions();

const fontCache = new Map();
let font = null;
let particles = [];
let currentHomes = [];
let activeTime = '';
let pulse = 0;
let lastSecond = -1;
let ready = false;

for (const entry of fonts) {
  const option = document.createElement('option');
  option.value = entry.url;
  option.textContent = entry.name;
  fontSelect.appendChild(option);
}

const defaultFont = fonts.find((entry) => /DSEG/i.test(entry.name))?.url || fonts[0]?.url || '';
fontSelect.value = defaultFont;

wireFoldawayPanel(panel, togglePanelButton, shuffleButton, () => {
  scaleInput.value = String(randomBetween(16, 24));
  scatterInput.value = String(randomBetween(0, 80));
  burstInput.value = String(randomBetween(16, 56));
  springInput.value = String(randomBetween(12, 28));
  wanderInput.value = String(randomBetween(2, 14));
  speedInput.value = String(randomBetween(12, 26));
  trailInput.value = String(randomBetween(6, 16));
  connectInput.value = String(randomBetween(48, 110));
  glowInput.value = String(randomBetween(28, 64));
  rebuild();
});

function getTimeString(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function matchHomeCount(homes, count) {
  if (!homes.length || count <= 0) return [];
  if (homes.length === count) return homes.slice();
  const matched = [];
  const stride = homes.length / count;
  for (let i = 0; i < count; i++) {
    matched.push(homes[Math.floor(i * stride) % homes.length]);
  }
  return matched;
}

function buildClockHomes(text) {
  if (!font) return [];
  return buildGlyphHomes(font, text, {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.5,
    originY: window.innerHeight * 0.56,
    letterSpacing: 26,
    maxPoints: 880
  });
}

function applyParticleControls() {
  const spring = Number(springInput.value) * 0.0012;
  const maxSpeed = Number(speedInput.value);
  const wander = Number(wanderInput.value) * 0.018;
  for (const particle of particles) {
    particle.__springClips = [{ clip: { x: particle.homeX, y: particle.homeY }, k: spring }];
    particle.maxSpeed = maxSpeed;
    particle.wander = wander;
    particle.damp = 0.91;
  }
}

function createParticle(home, index) {
  const scatter = Number(scatterInput.value);
  const particle = new Particle();
  particle.x = home.x + (Math.random() - 0.5) * scatter;
  particle.y = home.y + (Math.random() - 0.5) * scatter;
  particle.vx = (Math.random() - 0.5) * 5;
  particle.vy = (Math.random() - 0.5) * 5;
  particle.width = 4;
  particle.height = 4;
  particle.bounce = -0.72;
  particle.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
  particle.setEdgeBehavior('bounce');
  particle.turnToPath(true);
  particle.homeX = home.x;
  particle.homeY = home.y;
  particle.orbit = Math.random() * Math.PI * 2;
  particle.colorHue = 194 + (index % 36) * 2.4;
  return particle;
}

function burstParticles() {
  const burst = Number(burstInput.value);
  pulse = 1;
  for (const particle of particles) {
    const dx = particle.x - particle.homeX;
    const dy = particle.y - particle.homeY;
    let angle = Math.atan2(dy, dx);
    if (!Number.isFinite(angle) || Math.abs(dx) + Math.abs(dy) < 0.5) {
      angle = Math.random() * Math.PI * 2;
    }
    const force = burst * (0.35 + Math.random() * 0.9);
    particle.vx += Math.cos(angle) * force;
    particle.vy += Math.sin(angle) * force;
  }
}

function syncParticlesToHomes(newHomes, isInitial = false) {
  if (!newHomes.length) {
    particles = [];
    currentHomes = [];
    particleChip.textContent = '0 particles';
    return;
  }

  if (!particles.length || isInitial || particles.length !== newHomes.length) {
    particles = newHomes.map((home, index) => createParticle(home, index));
  } else {
    for (let i = 0; i < particles.length; i++) {
      const target = newHomes[i];
      particles[i].homeX = target.x;
      particles[i].homeY = target.y;
      particles[i].colorHue = 194 + (i % 36) * 2.4;
    }
  }

  currentHomes = newHomes.slice();
  particleChip.textContent = `${particles.length} particles`;
  applyParticleControls();
  burstParticles();
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
  ready = false;
  await ensureFont();
  const now = new Date();
  activeTime = getTimeString(now);
  lastSecond = now.getSeconds();
  timeChip.textContent = activeTime;
  const homes = buildClockHomes(activeTime);
  syncParticlesToHomes(homes, true);
  ready = true;
}

function updateClockIfNeeded() {
  if (!ready || !font) return;
  const now = new Date();
  const second = now.getSeconds();
  if (second === lastSecond && activeTime) return;
  lastSecond = second;
  const nextTime = getTimeString(now);
  if (nextTime === activeTime && currentHomes.length) {
    burstParticles();
    return;
  }
  activeTime = nextTime;
  timeChip.textContent = activeTime;
  const homes = buildClockHomes(activeTime);
  syncParticlesToHomes(homes);
}

function drawBackground() {
  const trail = Number(trailInput.value) / 100;
  ctx.fillStyle = `rgba(4, 7, 18, ${trail})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const gradient = ctx.createRadialGradient(
    window.innerWidth * 0.5,
    window.innerHeight * 0.55,
    40,
    window.innerWidth * 0.5,
    window.innerHeight * 0.55,
    window.innerWidth * 0.42
  );
  gradient.addColorStop(0, `rgba(44, 116, 255, ${0.08 + pulse * 0.08})`);
  gradient.addColorStop(0.45, 'rgba(48, 25, 92, 0.06)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawConnections() {
  const connectDist = Number(connectInput.value);
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < Math.min(i + 12, particles.length); j++) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > connectDist) continue;
      const alpha = (1 - dist / connectDist) * (0.12 + pulse * 0.1);
      ctx.strokeStyle = `hsla(${(a.colorHue + b.colorHue) * 0.5}, 100%, 72%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function drawParticles() {
  const glow = Number(glowInput.value) * 0.1;
  for (const particle of particles) {
    const radius = 1.8 + glow * 0.015;
    ctx.shadowBlur = glow * (0.4 + pulse * 1.1);
    ctx.shadowColor = `hsla(${particle.colorHue}, 100%, 72%, 0.9)`;
    ctx.fillStyle = `hsla(${particle.colorHue}, 100%, ${72 + pulse * 10}%, 0.96)`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    const tailX = particle.x - Math.cos(particle.rotation || 0) * (7 + pulse * 10);
    const tailY = particle.y - Math.sin(particle.rotation || 0) * (7 + pulse * 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `hsla(${(particle.colorHue + 34) % 360}, 100%, 70%, ${0.12 + pulse * 0.1})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function animate() {
  if (ready) updateClockIfNeeded();
  pulse *= 0.92;
  drawBackground();
  drawConnections();
  for (const particle of particles) {
    particle.update();
  }
  drawParticles();
  requestAnimationFrame(animate);
}

fontSelect.addEventListener('change', rebuild);
scaleInput.addEventListener('input', rebuild);
scatterInput.addEventListener('input', rebuild);
[burstInput, springInput, wanderInput, speedInput].forEach((input) => input.addEventListener('input', applyParticleControls));
window.addEventListener('resize', () => {
  resizeCanvas(canvas, ctx);
  rebuild();
});

resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);
