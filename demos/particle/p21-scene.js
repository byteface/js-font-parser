import { Particle } from '../../dist/utils/Particle.js';
import {
  FontParser,
  bindMouse,
  buildGlyphHomes,
  randomBetween,
  resizeCanvas,
  wireFoldawayPanel
} from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'JoeJack', url: '../../truetypefonts/JoeJack.ttf' },
  { name: 'Quill', url: '../../truetypefonts/Quill.ttf' },
  { name: 'DiscoMo', url: '../../truetypefonts/DiscoMo.ttf' },
  { name: 'DevilInside', url: '../../truetypefonts/devil-inside-font/DevilInside-G3xP.ttf' },
  { name: 'AUGIE', url: '../../truetypefonts/AUGIE___.TTF' },
  { name: '20FACES', url: '../../truetypefonts/20FACES.TTF' },
  { name: 'Aims in your Life', url: '../../truetypefonts/Aims in your Life normal.ttf' },
  { name: 'CARDS', url: '../../truetypefonts/CARDS.TTF' },
  { name: 'ELLO', url: '../../truetypefonts/ELLO____.TTF' },
  { name: 'Minecraft', url: '../../truetypefonts/Minecraft.ttf' },
  { name: 'Kremlin Minister', url: '../../truetypefonts/kremlin_minister/Kremlin Minister.ttf' },
  { name: 'RENAV', url: '../../truetypefonts/RENAV___.TTF' },
  { name: 'ZWISDOM', url: '../../truetypefonts/ZWISDOM.ttf' },
  { name: 'Gotham Narrow Ultra', url: '../../truetypefonts/GothamNarrow-Ultra.otf' },
  { name: 'Source Sans 3', url: '../../truetypefonts/curated/SourceSans3-Regular.otf' },
  { name: 'Source Code Pro', url: '../../truetypefonts/source-code-pro/SourceCodePro-Regular.otf' },
  { name: 'Source Serif 4 Variable', url: '../../truetypefonts/OTF/source-serif4/SourceSerif4Variable-Roman.otf' },
  { name: 'Playwrite GB S Variable', url: '../../truetypefonts/Playwrite_GB_S/PlaywriteGBS-VariableFont_wght.ttf' },
  { name: 'Arimo Variable', url: '../../truetypefonts/arimo/Arimo[wght].ttf' },
  { name: 'Noto Sans', url: '../../truetypefonts/noto/NotoSans-Regular.ttf' }
];

const THEME = {
  pattern: /Quill|JoeJack|DiscoMo|Roboto|Source Sans|Noto Sans/i,
  title: 'Particle p21',
  subtitle: 'Inverted particle field with plain canvas rendering and a smaller control set.',
  background: 'radial-gradient(circle at 14% 12%, rgba(120, 140, 180, 0.12), transparent 22%), radial-gradient(circle at 88% 14%, rgba(236, 162, 162, 0.14), transparent 22%), linear-gradient(180deg, #f7f5ef 0%, #ece9e1 100%)',
  panel: 'rgba(255, 255, 255, 0.84)',
  line: 'rgba(62, 73, 91, 0.16)',
  ink: '#18202c',
  muted: '#5f6979',
  palettes: {
    graphite: ['#202631', '#4a5568', '#75839a'],
    bruise: ['#2f2446', '#5b4b8a', '#9070af'],
    rust: ['#5a2e2a', '#8d5a45', '#bf826a']
  },
  defaults: {
    text: 'VOID',
    scale: 22,
    scatter: 24,
    spring: 11,
    wander: 7,
    speed: 16,
    trail: 10,
    connect: 66,
    mouse: 'repel',
    palette: 'graphite'
  }
};

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function injectStyles() {
  let style = document.getElementById('particle-p21-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'particle-p21-style';
    document.head.appendChild(style);
  }

  style.textContent = `
    :root {
      --ink: ${THEME.ink};
      --muted: ${THEME.muted};
      --line: ${THEME.line};
      --panel: ${THEME.panel};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      overflow: hidden;
      color: var(--ink);
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      background: ${THEME.background};
    }
    .panel {
      position: fixed;
      top: 58px;
      left: 14px;
      z-index: 10;
      width: min(245px, calc(100vw - 28px));
      max-height: calc(100vh - 74px);
      overflow-y: auto;
      display: grid;
      gap: 10px;
      padding: 12px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: var(--panel);
      box-shadow: 0 18px 52px rgba(0,0,0,0.18);
    }
    .panel.collapsed .panelBody { display: none; }
    .bar { display: flex; justify-content: space-between; gap: 8px; }
    .title strong { display: block; margin-bottom: 4px; font-size: 20px; letter-spacing: -0.03em; }
    .title span { color: var(--muted); font-size: 12px; line-height: 1.35; }
    .actions { display: flex; gap: 6px; }
    .actions button {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--ink);
      background: rgba(255,255,255,0.05);
      font: inherit;
      cursor: pointer;
    }
    .grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
    label {
      display: grid;
      gap: 4px;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      color: var(--ink);
      background: rgba(255,255,255,0.06);
      font: inherit;
    }
    input[type="range"] { padding: 0; accent-color: ${THEME.ink}; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--muted);
      font-size: 12px;
    }
    canvas { display: block; width: 100vw; height: 100vh; }
  `;
}

function buildMarkup() {
  document.body.innerHTML += `
    <section class="panel" id="panel">
      <div class="bar">
        <div class="title">
          <strong>${escapeHtml(THEME.title)}</strong>
          <span>${escapeHtml(THEME.subtitle)}</span>
        </div>
        <div class="actions">
          <button id="randomizeButton" type="button">Shuffle</button>
          <button id="togglePanelButton" type="button">Hide</button>
        </div>
      </div>
      <div class="panelBody">
        <div class="grid">
          <label>Font<select id="fontSelect"></select></label>
          <label>Text<input id="textInput" value="${escapeHtml(THEME.defaults.text)}" maxlength="4" /></label>
          <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="${THEME.defaults.scale}" /></label>
          <label>Particle Size<input id="particleSizeInput" type="range" min="0" max="3" step="0.1" value="0.5" /></label>
          <label>Scatter<input id="scatterInput" type="range" min="0" max="60" value="${THEME.defaults.scatter}" /></label>
          <label>Spring<input id="springInput" type="range" min="4" max="20" value="${THEME.defaults.spring}" /></label>
          <label>Wander<input id="wanderInput" type="range" min="0" max="18" value="${THEME.defaults.wander}" /></label>
          <label>Max Speed<input id="speedInput" type="range" min="4" max="24" value="${THEME.defaults.speed}" /></label>
          <label>Trail<input id="trailInput" type="range" min="6" max="22" value="${THEME.defaults.trail}" /></label>
          <label>Connect<input id="connectInput" type="range" min="20" max="100" value="${THEME.defaults.connect}" /></label>
          <label>Mouse<select id="mouseModeInput"><option value="attract">Attract</option><option value="repel">Repel</option><option value="off">Off</option></select></label>
          <label>Palette<select id="paletteInput">${Object.keys(THEME.palettes).map((key) => `<option value="${key}">${key}</option>`).join('')}</select></label>
        </div>
        <div class="chips">
          <div class="chip" id="particleChip">0 particles</div>
          <div class="chip" id="fontChip">loading…</div>
        </div>
      </div>
    </section>
    <canvas id="stage"></canvas>
  `;
}

injectStyles();
buildMarkup();

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const panel = document.getElementById('panel');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const particleSizeInput = document.getElementById('particleSizeInput');
const scatterInput = document.getElementById('scatterInput');
const springInput = document.getElementById('springInput');
const wanderInput = document.getElementById('wanderInput');
const speedInput = document.getElementById('speedInput');
const trailInput = document.getElementById('trailInput');
const connectInput = document.getElementById('connectInput');
const mouseModeInput = document.getElementById('mouseModeInput');
const paletteInput = document.getElementById('paletteInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');

const fonts = FONT_OPTIONS;
const fontCache = new Map();
const mouse = { x: 0, y: 0, active: false };
let font = null;
let particles = [];
let rebuildToken = 0;

for (const entry of fonts) {
  const option = document.createElement('option');
  option.value = entry.url;
  option.textContent = entry.name;
  fontSelect.appendChild(option);
}
fontSelect.value = fonts.find((entry) => THEME.pattern.test(entry.name))?.url || fonts[0].url;
mouseModeInput.value = THEME.defaults.mouse;
paletteInput.value = THEME.defaults.palette;
bindMouse(canvas, mouse);
wireFoldawayPanel(panel, document.getElementById('togglePanelButton'), document.getElementById('randomizeButton'), () => {
  randomizeControls();
  rebuild();
});

function randomizeControls() {
  scaleInput.value = String(randomBetween(18, 30));
  particleSizeInput.value = String(randomBetween(0.3, 2.4, 0.1));
  scatterInput.value = String(randomBetween(8, 40));
  springInput.value = String(randomBetween(8, 16));
  wanderInput.value = String(randomBetween(4, 12));
  speedInput.value = String(randomBetween(10, 20));
  trailInput.value = String(randomBetween(8, 16));
  connectInput.value = String(randomBetween(44, 84));
  mouseModeInput.value = Math.random() > 0.5 ? THEME.defaults.mouse : (THEME.defaults.mouse === 'attract' ? 'repel' : 'attract');
  const paletteKeys = Object.keys(THEME.palettes);
  paletteInput.value = paletteKeys[randomBetween(0, paletteKeys.length - 1)];
}

async function ensureFont() {
  const url = fontSelect.value;
  if (!fontCache.has(url)) fontCache.set(url, FontParser.load(url));
  font = await fontCache.get(url);
  fontChip.textContent = fontSelect.selectedOptions[0]?.textContent || 'font';
}

function currentPalette() {
  return THEME.palettes[paletteInput.value] || Object.values(THEME.palettes)[0];
}

function makeParticles(homes) {
  const palette = currentPalette();
  const scatter = Number(scatterInput.value);
  const created = homes.map((home, index) => {
    const p = new Particle();
    p.x = home.x + (Math.random() - 0.5) * scatter;
    p.y = home.y + (Math.random() - 0.5) * scatter;
    p.vx = (Math.random() - 0.5) * 4;
    p.vy = (Math.random() - 0.5) * 4;
    p.width = 4;
    p.height = 4;
    p.damp = 0.925;
    p.bounce = -0.72;
    p.maxSpeed = Number(speedInput.value);
    p.wander = Number(wanderInput.value) * 0.02;
    p.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('bounce');
    p.homeX = home.x;
    p.homeY = home.y;
    p.phase = index * 0.15;
    p.color = palette[index % palette.length];
    return p;
  });
  particleChip.textContent = `${created.length} particles`;
  return created;
}

async function rebuild() {
  if (!FontParser || !fontSelect.value) return;
  const token = ++rebuildToken;
  await ensureFont();
  if (token !== rebuildToken) return;
  const homes = buildGlyphHomes(font, textInput.value || THEME.defaults.text, {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 22
  });
  particles = makeParticles(homes);
}

function updateForces(time) {
  const spring = Number(springInput.value) * 0.00135;
  const maxSpeed = Number(speedInput.value);
  const wander = Number(wanderInput.value) * 0.02;
  const mouseMode = mouseModeInput.value;

  for (const p of particles) {
    p.__springClips = [{
      clip: {
        x: p.homeX + Math.cos(time * 0.001 + p.phase) * 3,
        y: p.homeY + Math.sin(time * 0.0011 + p.phase) * 3
      },
      k: spring
    }];
    p.maxSpeed = maxSpeed;
    p.wander = wander;
    p.xMouse = mouse.x;
    p.yMouse = mouse.y;
    p.gravToMouse = mouse.active && mouseMode === 'attract';
    p.gravMouseForce = 1800;
    p.repelMouse = mouse.active && mouseMode === 'repel';
    p.repelMouseMinDist = 92;
    p.repelMouseK = 0.16;
  }
}

function drawBackground() {
  ctx.fillStyle = `rgba(245, 241, 233, ${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawScene() {
  const connectDist = Number(connectInput.value);
  const particleSize = Number(particleSizeInput.value);
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > connectDist) continue;
      const alpha = 1 - dist / connectDist;
      ctx.strokeStyle = `${a.color}${Math.round(alpha * 36).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animate(time) {
  drawBackground();
  updateForces(time);
  for (const p of particles) p.update();
  drawScene();
  requestAnimationFrame(animate);
}

[fontSelect, textInput, scaleInput, scatterInput, paletteInput].forEach((el) => el.addEventListener('input', rebuild));
[particleSizeInput, springInput, wanderInput, speedInput, trailInput, connectInput, mouseModeInput].forEach((el) => el.addEventListener('input', () => {}));

window.addEventListener('resize', () => {
  resizeCanvas(canvas, ctx);
  rebuild();
});

randomizeControls();
resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);
