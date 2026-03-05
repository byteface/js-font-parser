#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

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

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function main() {
  const args = parseArgs(process.argv);
  const base = args.base;
  const head = args.head;
  if (!base || !head) {
    throw new Error('Usage: node tests/golden/scripts/between-commits.mjs --base <sha> --head <sha> [--out tests/golden/diff]');
  }

  const repo = process.cwd();
  const outRoot = path.resolve(args.out || path.join(repo, 'tests/golden/diff'));
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'fontparser-golden-'));
  const wtBase = path.join(tmp, 'base');
  const wtHead = path.join(tmp, 'head');
  const outBase = path.join(tmp, 'shots-base');
  const outHead = path.join(tmp, 'shots-head');

  try {
    await run('git', ['worktree', 'add', '--detach', wtBase, base], { cwd: repo });
    await run('git', ['worktree', 'add', '--detach', wtHead, head], { cwd: repo });

    await run('node', ['tests/golden/scripts/capture.mjs', '--root', wtBase, '--out', outBase], { cwd: repo });
    await run('node', ['tests/golden/scripts/capture.mjs', '--root', wtHead, '--out', outHead], { cwd: repo });

    await fs.mkdir(outRoot, { recursive: true });
    await run('node', ['tests/golden/scripts/compare.mjs', '--base', outBase, '--head', outHead, '--out', outRoot], { cwd: repo });
  } finally {
    await run('git', ['worktree', 'remove', '--force', wtBase], { cwd: repo }).catch(() => {});
    await run('git', ['worktree', 'remove', '--force', wtHead], { cwd: repo }).catch(() => {});
    await rmrf(tmp);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
