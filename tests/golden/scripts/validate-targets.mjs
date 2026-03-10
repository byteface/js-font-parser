#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

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

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const rootDir = path.resolve(args.root || process.cwd());
  const targetsPath = path.resolve(args.targets || path.join(rootDir, 'tests/golden/targets.json'));

  const targets = JSON.parse(await fs.readFile(targetsPath, 'utf8'));
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error(`Targets file must be a non-empty array: ${targetsPath}`);
  }

  const idSet = new Set();
  for (const [idx, target] of targets.entries()) {
    if (!target || typeof target !== 'object') {
      throw new Error(`Invalid target at index ${idx}: expected object`);
    }
    if (!target.id || typeof target.id !== 'string') {
      throw new Error(`Invalid target at index ${idx}: missing string id`);
    }
    if (!target.path || typeof target.path !== 'string' || !target.path.startsWith('/')) {
      throw new Error(`Invalid target '${target.id}': path must be an absolute web path like /tools/index.html`);
    }
    if (idSet.has(target.id)) {
      throw new Error(`Duplicate target id: ${target.id}`);
    }
    idSet.add(target.id);

    const localPath = path.resolve(rootDir, `.${target.path}`);
    const ok = await fileExists(localPath);
    if (!ok) {
      throw new Error(`Target '${target.id}' points to missing file: ${target.path}`);
    }
  }

  process.stdout.write(`Validated ${targets.length} golden target(s): ${targetsPath}\n`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
