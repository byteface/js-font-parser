import { Particle } from '../../dist/utils/Particle.js';
import { FontParser, bindMouse, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'Minecraft', url: '../../truetypefonts/Minecraft.ttf' },
  { name: 'Gotham Narrow Ultra', url: '../../truetypefonts/GothamNarrow-Ultra.otf' },
  { name: 'Source Code Pro', url: '../../truetypefonts/source-code-pro/SourceCodePro-Regular.otf' },
  { name: 'Source Sans 3', url: '../../truetypefonts/curated/SourceSans3-Regular.otf' },
  { name: 'RENAV', url: '../../truetypefonts/RENAV___.TTF' },
  { name: 'ZWISDOM', url: '../../truetypefonts/ZWISDOM.ttf' }
];

document.body.innerHTML += `
  <style>
    :root { --ink:#ecf4ff; --muted:#9eb0c6; --line:rgba(139,179,255,0.14); --panel:rgba(10,15,29,0.82); }
    * { box-sizing:border-box; }
    body { margin:0; overflow:hidden; color:var(--ink); font-family:"IBM Plex Sans", system-ui, sans-serif; background:linear-gradient(180deg, #070d18 0%, #111522 100%); }
    .panel { position:fixed; top:58px; left:14px; z-index:10; width:min(230px, calc(100vw - 28px)); max-height:calc(100vh - 74px); overflow-y:auto; display:grid; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--line); background:var(--panel); }
    .panel.collapsed .panelBody { display:none; }
    .bar { display:flex; justify-content:space-between; gap:8px; }
    .title strong { display:block; margin-bottom:4px; font-size:20px; letter-spacing:-0.03em; }
    .title span { color:var(--muted); font-size:12px; line-height:1.35; }
    .actions { display:flex; gap:6px; }
    .actions button { border:1px solid var(--line); border-radius:999px; padding:6px 10px; color:var(--ink); background:rgba(255,255,255,0.05); font:inherit; cursor:pointer; }
    .grid { display:grid; gap:8px; }
    label { display:grid; gap:4px; color:var(--muted); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
    input, select { width:100%; border:1px solid var(--line); border-radius:12px; padding:10px 12px; color:var(--ink); background:rgba(255,255,255,0.06); font:inherit; }
    input[type="range"] { padding:0; accent-color:#7ee7ff; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { padding:5px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px; }
    canvas { display:block; width:100vw; height:100vh; }
  </style>
  <section class="panel" id="panel">
    <div class="bar">
      <div class="title">
        <strong>Particle p24</strong>
        <span>Every glyph point spins a local orbit. The letter becomes a machine made of tiny rotor systems.</span>
      </div>
      <div class="actions">
        <button id="randomizeButton" type="button">Shuffle</button>
        <button id="togglePanelButton" type="button">Hide</button>
      </div>
    </div>
    <div class="panelBody">
      <div class="grid">
        <label>Font<select id="fontSelect"></select></label>
        <label>Text<input id="textInput" value="ROTOR" maxlength="5" /></label>
        <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="22" /></label>
        <label>Particle Size<input id="particleSizeInput" type="range" min="0.4" max="2.5" step="0.1" value="1.1" /></label>
        <label>Orbit Radius<input id="orbitInput" type="range" min="4" max="30" value="12" /></label>
        <label>Orbit Pull<input id="springInput" type="range" min="4" max="18" value="10" /></label>
        <label>Trail<input id="trailInput" type="range" min="6" max="22" value="12" /></label>
      </div>
      <div class="chips"><div class="chip" id="particleChip">0 particles</div><div class="chip" id="fontChip">loading…</div></div>
    </div>
  </section>
  <canvas id="stage"></canvas>
`;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const particleSizeInput = document.getElementById('particleSizeInput');
const orbitInput = document.getElementById('orbitInput');
const springInput = document.getElementById('springInput');
const trailInput = document.getElementById('trailInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');
const fontCache = new Map();
let font = null;
let particles = [];
let rebuildToken = 0;

for (const entry of FONT_OPTIONS) {
  const option = document.createElement('option');
  option.value = entry.url;
  option.textContent = entry.name;
  fontSelect.appendChild(option);
}
fontSelect.value = FONT_OPTIONS[0].url;
wireFoldawayPanel(document.getElementById('panel'), document.getElementById('togglePanelButton'), document.getElementById('randomizeButton'), () => {
  scaleInput.value = String(randomBetween(18, 30));
  particleSizeInput.value = String(randomBetween(0.6, 1.8, 0.1));
  orbitInput.value = String(randomBetween(8, 22));
  springInput.value = String(randomBetween(7, 15));
  trailInput.value = String(randomBetween(10, 18));
  rebuild();
});

async function ensureFont() {
  const url = fontSelect.value;
  if (!fontCache.has(url)) fontCache.set(url, FontParser.load(url));
  font = await fontCache.get(url);
  fontChip.textContent = fontSelect.selectedOptions[0]?.textContent || 'font';
}

async function rebuild() {
  if (!FontParser) return;
  const token = ++rebuildToken;
  await ensureFont();
  if (token !== rebuildToken) return;
  const homes = buildGlyphHomes(font, textInput.value || 'ROTOR', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 18,
    maxPoints: 280
  });
  particles = homes.map((home, index) => {
    const p = new Particle();
    p.x = home.x;
    p.y = home.y;
    p.vx = 0;
    p.vy = 0;
    p.width = 4;
    p.height = 4;
    p.damp = 0.93;
    p.bounce = -0.7;
    p.maxSpeed = 14;
    p.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('bounce');
    p.anchorX = home.x;
    p.anchorY = home.y;
    p.phase = index * 0.18;
    p.color = index % 2 ? '#7ee7ff' : '#fca5a5';
    return p;
  });
  particleChip.textContent = `${particles.length} particles`;
}

function animate(time) {
  ctx.fillStyle = `rgba(7, 13, 24, ${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const radius = Number(orbitInput.value);
  const spring = Number(springInput.value) * 0.0014;
  const size = Number(particleSizeInput.value);
  for (const p of particles) {
    const orbitX = p.anchorX + Math.cos(time * 0.0013 + p.phase) * radius;
    const orbitY = p.anchorY + Math.sin(time * 0.0016 + p.phase) * radius;
    p.__springClips = [{ clip: { x: orbitX, y: orbitY }, k: spring }];
    p.update();
    ctx.strokeStyle = `${p.color}26`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.anchorX, p.anchorY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(animate);
}

[fontSelect, textInput, scaleInput].forEach((el) => el.addEventListener('input', rebuild));
window.addEventListener('resize', () => { resizeCanvas(canvas, ctx); rebuild(); });
resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);
