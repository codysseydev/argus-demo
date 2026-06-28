# Development

## Prerequisites

- **Node.js 20** — CI runs on Node 20 (`node-version: '20'` in `.github/workflows/ci.yml`). Node 22 works locally.
- **npm** — used for all package management; no yarn or pnpm config present.

## Setup

```bash
npm install
```

## Scripts

| Script | Command | What it does |
|---|---|---|
| `dev` | `vite` | Starts the Vite dev server with HMR on `http://localhost:5173` |
| `build` | `tsc --noEmit && vite build` | Type-checks then produces a production bundle in `dist/` |
| `preview` | `vite preview` | Serves the contents of `dist/` locally; no dev proxy |
| `test` | `vitest run` | Runs all tests once in jsdom, exits |
| `test:watch` | `vitest` | Runs tests in watch mode |
| `typecheck` | `tsc --noEmit` | Type-checks without producing output |
| `lint` | `eslint .` | Lints the entire project |

CI runs `lint`, `test`, and `build` in that order.

## Running locally

The dev server must be able to forward requests to a running Laravel app that mounts the Argus API routes. Set `ARGUS_API_TARGET` to that app's local origin:

```bash
ARGUS_API_TARGET=http://localhost:8000 npm run dev
```

Open `http://localhost:5173`. You must already have an active session in the Laravel app (i.e. be signed in) for API requests to authorize. The dev proxy forwards `/argus-api` and `/sanctum` to the target, so the Sanctum session cookie applies without CORS.

If you only want to verify the UI renders or run tests, the dev server can start without `ARGUS_API_TARGET`. It defaults to `http://localhost:8000` but that target does not need to be reachable unless you make actual API calls.

## Tests

Tests run against MSW-mocked HTTP. No running backend is required.

```bash
npm test          # single run
npm run test:watch  # watch mode
```

The MSW server is set up in `src/test/setup.ts` and handlers live in `src/test/msw/handlers.ts`. Test utilities and shared fixtures are in `src/test/`.

## Type checking and lint

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
```

`tsconfig.json` has `strict: true`, `noUnusedLocals`, and `noUnusedParameters`. `build` always runs `typecheck` first, so a type error will also fail the build.
