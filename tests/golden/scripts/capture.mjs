#!/usr/bin/env node
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = value;
  }
  return out;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.mjs': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    case '.ttf': return 'font/ttf';
    case '.otf': return 'font/otf';
    default: return 'application/octet-stream';
  }
}

function makeServer(rootDir) {
  return http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let reqPath = decodeURIComponent(reqUrl.pathname);
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const absPath = path.resolve(rootDir, `.${reqPath}`);
      if (!absPath.startsWith(path.resolve(rootDir))) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      let stat;
      try {
        stat = await fs.stat(absPath);
      } catch {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      const filePath = stat.isDirectory() ? path.join(absPath, 'index.html') : absPath;
      const stream = fssync.createReadStream(filePath);
      res.setHeader('Content-Type', contentType(filePath));
      stream.on('error', () => {
        res.statusCode = 500;
        res.end('Server error');
      });
      stream.pipe(res);
    } catch {
      res.statusCode = 500;
      res.end('Server error');
    }
  });
}

async function clearPngFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.png')) {
        await fs.rm(path.join(dir, entry.name), { force: true });
      }
    }
  } catch (err) {
    if (err && err.code === 'ENOENT') return;
    throw err;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const rootDir = path.resolve(args.root || process.cwd());
  const outDir = path.resolve(args.out || path.join(process.cwd(), 'tests/golden/current'));
  const targetsPath = path.resolve(args.targets || path.join(process.cwd(), 'tests/golden/targets.json'));
  const port = Number(args.port || '4173');
  const timeoutMs = Number(args.timeoutMs || '15000');

  const targets = JSON.parse(await fs.readFile(targetsPath, 'utf8'));
  await fs.mkdir(outDir, { recursive: true });
  await clearPngFiles(outDir);

  const server = makeServer(rootDir);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const target of targets) {
      const page = await browser.newPage({
        viewport: {
          width: Number(target.width || 1440),
          height: Number(target.height || 900)
        }
      });
      page.setDefaultTimeout(timeoutMs);
      const url = `http://127.0.0.1:${port}${target.path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.addStyleTag({
        content: `
          *,
          *::before,
          *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
          }
        `
      });
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      });
      if (target.waitSelector) {
        await page.waitForSelector(target.waitSelector, { timeout: timeoutMs });
      }
      if (target.waitMs) {
        await page.waitForTimeout(Number(target.waitMs));
      }
      const filePath = path.join(outDir, `${target.id}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      await page.close();
      process.stdout.write(`captured ${target.id}\n`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
