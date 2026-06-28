# Contributing to Argus UI

## Prerequisites

- Node 20 or later
- npm (comes with Node)
- A running instance of the [Argus API](https://github.com/codysseydev/argus-api)
  for local development (the SPA proxies to it; you do not need it for tests)

## Setup

```bash
npm install
```

## Development

Start the Vite dev server:

```bash
ARGUS_API_TARGET=http://localhost:8000 npm run dev
```

`ARGUS_API_TARGET` tells Vite where to proxy `/argus-api` and `/sanctum` requests.
Point it at the Laravel app that mounts the Argus API routes. You must already be
signed in to that app for authorized requests to work (the session cookie rides the
proxy).

Open the URL printed by Vite (default `http://localhost:5173`).

See `.env.example` for all environment variables.

## Lint

```bash
npm run lint
```

ESLint is configured with the TypeScript and React Hooks plugins. Fix all lint
errors before opening a PR.

## Tests

```bash
npm run test
```

Tests run with [Vitest](https://vitest.dev/) in a jsdom environment. HTTP is
mocked via [MSW](https://mswjs.io/) — no live backend is required. Run
`npm run test:watch` for watch mode during development.

## Build

```bash
npm run build
```

This runs `tsc --noEmit` (type-check) followed by `vite build`. Output goes to
`dist/`. Run `npm run preview` to serve the built bundle locally.

## Coding standards

- **TypeScript**: strict mode is on. All exported symbols should be typed; avoid
  `any`.
- **ESLint**: all rules enforced by the project config must pass (`npm run lint`).
- **React**: use function components and hooks. Business logic belongs in hooks or
  `ArgusApiClient`, not in component render bodies.
- **HTTP**: all fetch calls go through `ArgusApiClient`. Components never call
  `fetch` directly.
- **Tests**: new screens, hooks, and client methods should have corresponding
  Vitest tests. Cover the happy path plus error states (network error, 401, 403,
  422 with validation errors).

## Pull request process

1. Fork the repo and create a branch from `main`.
2. Make your changes. Ensure `npm run lint`, `npm run test`, and `npm run build`
   all pass cleanly.
3. Update `CHANGELOG.md` under `## [Unreleased]` with a summary of your changes.
4. Open a pull request against `main` on `codysseydev/argus-ui`. Describe what
   the PR changes and why.
5. A maintainer will review and merge.
