import { Particle } from '../../dist/utils/Particle.js';
import { FontParser, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'JoeJack', url: '../../truetypefonts/JoeJack.ttf' },
  { name: 'DiscoMo', url: '../../truetypefonts/DiscoMo.ttf' },
  { name: 'Source Sans 3', url: '../../truetypefonts/curated/SourceSans3-Regular.otf' },
  { name: 'Source Serif 4 Variable', url: '../../truetypefonts/OTF/source-serif4/SourceSerif4Variable-Roman.otf' }
];

document.body.innerHTML += `
  <style>
    :root { --ink:#f4f8ff; --muted:#a0b1c8; --line:rgba(146,188,255,0.15); --panel:rgba(9,14,28,0.8); }
    * { box-sizing:border-box; }
    body { margin:0; overflow:hidden; color:var(--ink); font-family:"IBM Plex Sans", system-ui, sans-serif; background:linear-gradient(180deg, #080d17 0%, #101722 100%); }
    .panel { position:fixed; top:58px; left:14px; z-index:10; width:min(220px, calc(100vw - 28px)); max-height:calc(100vh - 74px); overflow-y:auto; display:grid; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--line); background:var(--panel); }
    .panel.collapsed .panelBody { display:none; }
    .bar { display:flex; justify-content:space-between; gap:8px; }
    .title strong { display:block; margin-bottom:4px; font-size:20px; letter-spacing:-0.03em; }
    .title span { color:var(--muted); font-size:12px; line-height:1.35; }
    .actions { display:flex; gap:6px; }
    .actions button { border:1px solid var(--line); border-radius:999px; padding:6px 10px; color:var(--ink); background:rgba(255,255,255,0.05); font:inherit; cursor:pointer; }
    .grid { display:grid; gap:8px; }
    label { display:grid; gap:4px; color:var(--muted); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
    input, select { width:100%; border:1px solid var(--line); border-radius:12px; padding:10px 12px; color:var(--ink); background:rgba(255,255,255,0.06); font:inherit; }
    input[type="range"] { padding:0; accent-color:#c4b5fd; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { padding:5px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px; }
    canvas { display:block; width:100vw; height:100vh; }
  </style>
  <section class="panel" id="panel">
    <div class="bar">
      <div class="title">
        <strong>Particle p25</strong>
        <span>Letterforms dissolve and reform. It is the most overtly theatrical of the four.</span>
      </div>
      <div class="actions">
        <button id="randomizeButton" type="button">Shuffle</button>
        <button id="togglePanelButton" type="button">Hide</button>
      </div>
    </div>
    <div class="panelBody">
      <div class="grid">
        <label>Font<select id="fontSelect"></select></label>
        <label>From<input id="textAInput" value="FORM" maxlength="4" /></label>
        <label>To<input id="textBInput" value="VOID" maxlength="4" /></label>
        <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="22" /></label>
        <label>Particle Size<input id="particleSizeInput" type="range" min="0.4" max="2.5" step="0.1" value="1.1" /></label>
        <label>Morph Speed<input id="morphInput" type="range" min="2" max="16" value="8" /></label>
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
const textAInput = document.getElementById('textAInput');
const textBInput = document.getElementById('textBInput');
const scaleInput = document.getElementById('scaleInput');
const particleSizeInput = document.getElementById('particleSizeInput');
const morphInput = document.getElementById('morphInput');
const trailInput = document.getElementById('trailInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');
const fontCache = new Map();
let font = null;
let particles = [];
let homesA = [];
let homesB = [];
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
  particleSizeInput.value = String(randomBetween(0.7, 2, 0.1));
  morphInput.value = String(randomBetween(5, 12));
  trailInput.value = String(randomBetween(10, 18));
  rebuild();
});

async function ensureFont() {
  const url = fontSelect.value;
  if (!fontCache.has(url)) fontCache.set(url, FontParser.load(url));
  font = await fontCache.get(url);
  fontChip.textContent = fontSelect.selectedOptions[0]?.textContent || 'font';
}

function matchPointCount(a, b) {
  const max = Math.max(a.length, b.length);
  const outA = [];
  const outB = [];
  for (let i = 0; i < max; i++) {
    outA.push(a[i % a.length]);
    outB.push(b[i % b.length]);
  }
  return [outA, outB];
}

async function rebuild() {
  if (!FontParser) return;
  const token = ++rebuildToken;
  await ensureFont();
  if (token !== rebuildToken) return;
  homesA = buildGlyphHomes(font, textAInput.value || 'FORM', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 18,
    maxPoints: 320
  });
  homesB = buildGlyphHomes(font, textBInput.value || 'VOID', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 18,
    maxPoints: 320
  });
  if (!homesA.length || !homesB.length) return;
  const [a, b] = matchPointCount(homesA, homesB);
  particles = a.map((home, index) => {
    const p = new Particle();
    p.x = home.x;
    p.y = home.y;
    p.vx = 0;
    p.vy = 0;
    p.width = 4;
    p.height = 4;
    p.damp = 0.92;
    p.bounce = -0.7;
    p.maxSpeed = 16;
    p.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('bounce');
    p.homeAX = home.x;
    p.homeAY = home.y;
    p.homeBX = b[index].x;
    p.homeBY = b[index].y;
    p.phase = index * 0.1;
    p.color = index % 2 ? '#c4b5fd' : '#7dd3fc';
    return p;
  });
  particleChip.textContent = `${particles.length} particles`;
}

function animate(time) {
  ctx.fillStyle = `rgba(8, 13, 23, ${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const t = (Math.sin(time * (Number(morphInput.value) * 0.00025)) * 0.5) + 0.5;
  const size = Number(particleSizeInput.value);
  for (const p of particles) {
    const tx = p.homeAX + (p.homeBX - p.homeAX) * t;
    const ty = p.homeAY + (p.homeBY - p.homeAY) * t;
    p.__springClips = [{ clip: { x: tx, y: ty }, k: 0.018 }];
    p.wander = 0.04;
    p.update();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(animate);
}

[fontSelect, textAInput, textBInput, scaleInput].forEach((el) => el.addEventListener('input', rebuild));
window.addEventListener('resize', () => { resizeCanvas(canvas, ctx); rebuild(); });
resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);
