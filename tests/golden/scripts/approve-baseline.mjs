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

async function listPngs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.png')).map((e) => e.name).sort();
}

async function main() {
  const args = parseArgs(process.argv);
  const fromDir = path.resolve(args.from || path.join(process.cwd(), 'tests/golden/current'));
  const toDir = path.resolve(args.to || path.join(process.cwd(), 'tests/golden/baseline'));

  await fs.mkdir(toDir, { recursive: true });
  const sourceFiles = await listPngs(fromDir);
  if (sourceFiles.length === 0) {
    throw new Error(`No PNG files found in source directory: ${fromDir}`);
  }

  const targetFiles = await listPngs(toDir).catch((err) => {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  });

  for (const file of targetFiles) {
    await fs.rm(path.join(toDir, file), { force: true });
  }

  for (const file of sourceFiles) {
    await fs.copyFile(path.join(fromDir, file), path.join(toDir, file));
  }

  process.stdout.write(`Approved ${sourceFiles.length} baseline screenshot(s).\n`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
