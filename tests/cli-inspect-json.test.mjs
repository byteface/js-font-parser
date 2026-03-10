import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

test('CLI inspect --json includes scripts/variation/color/diagnostics sections', () => {
  const cliPath = path.join(repoRoot, 'proj/fontparser/index.mjs');
  const fontPath = path.join(repoRoot, 'truetypefonts/DiscoMo.ttf');
  const run = spawnSync(process.execPath, [cliPath, 'inspect', '--font', fontPath, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'inspect');
  assert.ok(payload.data);
  assert.ok(payload.data.scripts);
  assert.ok(payload.data.variation);
  assert.ok(payload.data.color);
  assert.ok(payload.data.diagnostics);
  assert.equal(typeof payload.data.diagnostics.total, 'number');
});
