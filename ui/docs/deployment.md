# Deployment

## Build

```bash
npm run build
```

This runs `tsc --noEmit` (type-check) then `vite build`. Output lands in `dist/`. The build fails if there are type errors.

To set `VITE_ARGUS_API_BASE` at build time without a `.env.local` file:

```bash
VITE_ARGUS_API_BASE=/ops/argus npm run build
```

`VITE_ARGUS_API_BASE` is baked into the bundle at build time. Once built, the base path cannot be changed without rebuilding.

## Serving `dist/`

The built `dist/` is a standard static bundle: `index.html` plus hashed JS/CSS assets. It must be served from the **same origin** as the Laravel app that mounts the Argus API routes.

Same-origin is required because the app relies on the Sanctum session cookie for authentication. The API client sends `credentials: 'include'` on every request and reads the `XSRF-TOKEN` cookie to populate `X-XSRF-TOKEN` on mutating requests. Cross-origin requests would need explicit CORS allowlisting and `SameSite` cookie changes.

### Option 1: Publish into the Laravel app's public assets

Build the SPA and copy `dist/` into the Laravel app's `public/` directory (or a subdirectory). The Laravel app serves the files directly. `VITE_ARGUS_API_BASE` stays at `/argus-api` (the default).

### Option 2: Reverse proxy (nginx, Caddy, etc.)

Serve `dist/` at `/` from a static file handler and proxy `/argus-api` to the Laravel app on the same domain. Both the static files and the API share the same origin, so the session cookie applies. Example nginx block:

```nginx
location / {
    root /var/www/argus-ui/dist;
    try_files $uri /index.html;
}

location /argus-api {
    proxy_pass http://laravel-app:8000;
}

location /sanctum {
    proxy_pass http://laravel-app:8000;
}
```

`try_files $uri /index.html` is required because the SPA uses client-side routing (React Router v6). Any path that does not match a static file must fall through to `index.html`.

## Sanctum / session-cookie considerations

- The SPA has no login flow. 401 responses are rendered as a UI state ("session expired"). Users must sign in to the surrounding Laravel app first.
- If the Sanctum session is not yet established when the SPA loads, GET requests will return 401 immediately. Navigate to the Laravel app's login and sign in, then return to the SPA.
- Mutating requests (POST, PUT, DELETE) require a valid `XSRF-TOKEN` cookie. The client reads this cookie automatically (`src/api/client.ts: readXsrfCookie`). If the cookie is missing, the `X-XSRF-TOKEN` header is omitted and the request will be rejected by Laravel's CSRF middleware.

## Verifying the build locally

```bash
npm run preview
```

`vite preview` serves `dist/` on `http://localhost:4173`. There is no dev proxy in preview mode, so API calls will fail unless the Laravel app is accessible at the same origin or the browser is configured to allow cross-origin cookies (not recommended).
