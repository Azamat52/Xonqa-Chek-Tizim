# Production readiness notes

## Dependency updates
- Recharts upgraded from 2.x to 3.10.1.
- ESLint upgraded from the end-of-life 9.x line to 10.x.
- `@eslint/js` upgraded to 10.x and `eslint-plugin-react-hooks` to 7.1.1 (ESLint 10-compatible).
- Removed optional lint plugins that were not needed for the current flat config; Prettier remains available as a standalone check.
- Added `react-is` matching the installed React 19 major/minor line, as recommended by Recharts.

## First install after extracting
Run `npm install` once to resolve the updated dependency graph and create `package-lock.json`.
Commit that generated lockfile. In CI and subsequent deployments, use `npm ci`.

## Verification limitation
The package registry was unreachable in the preparation environment, so dependency installation, `npm audit`, lint, and Vite production build could not be completed here. Run `npm run check` after the first successful install and resolve any reported issues before deploying.

## Secrets and local state
- The supplied `.env` and Supabase CLI `.temp` metadata were excluded.
- `.env.example` contains placeholders only.
- Never put Supabase service-role keys or admin passwords in Vite `VITE_*` variables.
