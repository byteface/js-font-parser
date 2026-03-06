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
  const baseDir = path.resolve(args.base || path.join(process.cwd(), 'tests/golden/baseline'));
  const headDir = path.resolve(args.head || path.join(process.cwd(), 'tests/golden/current'));
  const outDir = path.resolve(args.out || path.join(process.cwd(), 'tests/golden/diff'));

  await fs.mkdir(outDir, { recursive: true });

  const baseFiles = await listPngs(baseDir);
  const headFiles = await listPngs(headDir);
  const all = Array.from(new Set([...baseFiles, ...headFiles])).sort();

  const summary = {
    total: all.length,
    compared: 0,
    changed: 0,
    missingInBase: [],
    missingInHead: [],
    results: []
  };

  for (const file of all) {
    const basePath = path.join(baseDir, file);
    const headPath = path.join(headDir, file);

    const hasBase = baseFiles.includes(file);
    const hasHead = headFiles.includes(file);
    if (!hasBase) {
      summary.missingInBase.push(file);
      continue;
    }
    if (!hasHead) {
      summary.missingInHead.push(file);
      continue;
    }

    const [baseBuf, headBuf] = await Promise.all([fs.readFile(basePath), fs.readFile(headPath)]);
    const changed = !baseBuf.equals(headBuf);

    summary.compared += 1;
    if (changed) {
      summary.changed += 1;
      const fileStem = file.replace(/\.png$/i, '');
      await fs.copyFile(basePath, path.join(outDir, `${fileStem}.base.png`));
      await fs.copyFile(headPath, path.join(outDir, `${fileStem}.head.png`));
    }

    summary.results.push({
      file,
      baseBytes: baseBuf.length,
      headBytes: headBuf.length,
      changed
    });
  }

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const lines = [];
  lines.push('# Golden Image Comparison');
  lines.push('');
  lines.push(`- Total targets: ${summary.total}`);
  lines.push(`- Compared: ${summary.compared}`);
  lines.push(`- Changed: ${summary.changed}`);
  if (summary.missingInBase.length) lines.push(`- Missing in base: ${summary.missingInBase.join(', ')}`);
  if (summary.missingInHead.length) lines.push(`- Missing in head: ${summary.missingInHead.join(', ')}`);
  lines.push('');
  lines.push('| Target | Base Bytes | Head Bytes | Changed |');
  lines.push('|---|---:|---:|:---:|');
  for (const r of summary.results) {
    lines.push(`| ${r.file} | ${r.baseBytes} | ${r.headBytes} | ${r.changed ? 'yes' : 'no'} |`);
  }
  await fs.writeFile(path.join(outDir, 'summary.md'), `${lines.join('\n')}\n`);

  if (summary.changed > 0 || summary.missingInBase.length > 0 || summary.missingInHead.length > 0) {
    process.stderr.write(
      `Golden comparison failed (changed=${summary.changed}, missingInBase=${summary.missingInBase.length}, missingInHead=${summary.missingInHead.length}).\n`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
