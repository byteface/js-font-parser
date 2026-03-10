# Release Checklist

This checklist is the canonical release flow for `js-font-parser`.

## Scope

Use this for any npm package release (patch/minor/major).

## Release Rules

- Release from a clean working tree only.
- Release from the intended branch (`js-font-parser` currently).
- Ensure docs are aligned before publish:
  - `README.md`
  - `docs/API.md`
  - `proj/fontparser/README.md`
- Do not publish if required CI checks are red.

## 1) Preflight

```bash
git status
git branch --show-current
node -v
npm -v
```

Expect:
- `git status` clean
- correct release branch
- supported Node version (`>=20`, recommended current project version)

## 2) Sync and Verify

```bash
git pull --rebase
npm install
```

If lockfile changes unexpectedly, stop and review.

## 3) Build and Test Gates

Required:

```bash
npm run build
npm test
npm run audit:tables
npm run test:golden:validate
```

Recommended before significant release:

```bash
npm run test:full
npm run test:coverage
npm run test:perf:enforce
```

## 4) Version Bump

Pick one:

```bash
npm version patch
# or
npm version minor
# or
npm version major
```

This updates `package.json` and creates a version commit + tag.

If you prefer manual tagging/versioning, do that consistently and skip `npm version`.

## 5) Package Validation (Must)

Dry-run publish and inspect tarball contents:

```bash
npm pack --dry-run
```

Confirm expected files include:
- `dist/`
- `dist-build/`
- `README.md`
- `LICENSE`

Confirm unexpected files are not included.

## 6) Optional Local Install Smoke Test (Recommended)

```bash
npm pack
TMP_TGZ=$(ls -t js-font-parser-*.tgz | head -n 1)
mkdir -p /tmp/jsfp-smoke && cd /tmp/jsfp-smoke
npm init -y
npm i "/absolute/path/to/$TMP_TGZ"
node -e "import('js-font-parser').then(m=>console.log(Object.keys(m)))"
```

Then return to repo root.

## 7) Publish

```bash
npm publish
```

For scoped packages or restricted access, apply the required npm flags.

## 8) Push Commits and Tags

```bash
git push
git push --tags
```

## 9) Post-Release Verification

- Verify package/version on npm.
- Confirm install works in a fresh project.
- Check key entrypoint import:
  - `import { FontParser } from 'js-font-parser'`
- Check browser UMD flow still works with built artifact:
  - `dist-build/fontparser.min.js`

## 10) Release Notes

Document:
- user-facing features/fixes
- breaking changes and migration notes
- known limitations (if any)

## Fast Path (Patch Release)

```bash
npm run build && npm test && npm run audit:tables && npm run test:golden:validate
npm version patch
npm pack --dry-run
npm publish
git push && git push --tags
```
