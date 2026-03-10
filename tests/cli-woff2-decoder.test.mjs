import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

test("CLI inspect on WOFF2 fails with actionable decoder error when no decoder is configured", () => {
  const cliPath = path.join(repoRoot, "proj/fontparser/index.mjs");
  const fontPath = path.join(repoRoot, "truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2");
  const run = spawnSync(process.execPath, [cliPath, "inspect", "--font", fontPath, "--json"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(run.status, 5, run.stderr || run.stdout);
  const payload = JSON.parse(run.stdout || run.stderr);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "E_COMMAND");
  assert.match(payload.error.message, /--woff2-decoder/);
});

test("CLI inspect on WOFF2 succeeds when --woff2-decoder module is provided", () => {
  const cliPath = path.join(repoRoot, "proj/fontparser/index.mjs");
  const fontPath = path.join(repoRoot, "truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2");
  const decoderPath = path.join(repoRoot, "tests/helpers/mock-woff2-decoder.mjs");
  const run = spawnSync(
    process.execPath,
    [cliPath, "inspect", "--font", fontPath, "--woff2-decoder", decoderPath, "--json"],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(run.status, 0, run.stderr || run.stdout);
  const payload = JSON.parse(run.stdout || run.stderr);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, "inspect");
  assert.equal(typeof payload.data?.metadata?.raw?.names?.family, "string");
});
