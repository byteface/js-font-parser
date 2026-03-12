import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const testsDir = path.join(root, 'tests');

const entries = await readdir(testsDir, { withFileTypes: true });
const testFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
  .map((entry) => path.join('tests', entry.name))
  .sort();

if (testFiles.length === 0) {
  console.error('No test files found in tests/.');
  process.exit(1);
}

const args = [...process.argv.slice(2), ...testFiles];
const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
