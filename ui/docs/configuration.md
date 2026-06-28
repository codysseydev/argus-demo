# Configuration

## Environment variables

### `VITE_ARGUS_API_BASE`

Base path the API client prefixes onto every request URL.

- **Default**: `/argus-api`
- **Used by**: `src/api/client.ts` at module load: `import.meta.env.VITE_ARGUS_API_BASE ?? '/argus-api'`
- **Scope**: baked into the bundle at build time (Vite replaces `import.meta.env.*` statically)

Set this if the Laravel app mounts the Argus API routes under a prefix other than `/argus-api`. Example:

```
VITE_ARGUS_API_BASE=/ops/argus
```

All API paths (`/search`, `/jobs/:uuid/history`, `/saved-searches`, etc.) are appended to this value after stripping any trailing slash.

### `ARGUS_API_TARGET`

Dev-server only. The origin Vite proxies `/argus-api` and `/sanctum` to.

- **Default**: `http://localhost:8000`
- **Used by**: `vite.config.ts` at dev-server startup: `process.env.ARGUS_API_TARGET ?? 'http://localhost:8000'`
- **Scope**: never reaches the browser; read by the Node.js Vite process only

This variable is not prefixed with `VITE_` and is not available inside the app bundle. It has no effect on `vite build` or `vite preview`.

## `.env.example`

```
# Base path the typed API client prefixes onto every request. Defaults to
# /argus-api (same-origin with the Laravel app that mounts the Phase 4 routes).
VITE_ARGUS_API_BASE=/argus-api

# Dev only: where `vite dev` proxies /argus-api and /sanctum. Point at your local
# Laravel app so the Sanctum session cookie rides along.
ARGUS_API_TARGET=http://localhost:8000
```

Copy to `.env.local` to override values locally without editing `.env.example`.

## Vite dev proxy

`vite.config.ts` configures two proxy rules for the dev server:

```
/argus-api  ->  ARGUS_API_TARGET  (changeOrigin: true)
/sanctum    ->  ARGUS_API_TARGET  (changeOrigin: true)
```

Both paths are forwarded with `changeOrigin: true` so the Laravel app sees a same-origin host header. This makes the Sanctum session cookie valid for API requests without CORS configuration. The `/sanctum` proxy is specifically for the CSRF cookie endpoint (`/sanctum/csrf-cookie`).

In production there is no proxy. Same-origin is achieved by serving the built `dist/` from the same domain as the Laravel app (see [deployment.md](deployment.md)).
