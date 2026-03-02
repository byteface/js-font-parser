# TS Porting Audit

The legacy JS/AS source tree has been removed. The TypeScript implementation is now the single source of truth.

## Notes
- Feature work should land in `src/` and flow into `dist/` via `npx tsc`.
