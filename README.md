# Argus Demo

A runnable Laravel application that wires the three Argus packages together so you
can see queue observability working in a browser:

| Package | Repo | Role |
|---------|------|------|
| `codysseydev/argus` | [argus](https://github.com/codysseydev/argus) | Core library: records the lifecycle of every queued job into Postgres. No HTTP, no UI. |
| `codysseydev/argus-api` | [argus-api](https://github.com/codysseydev/argus-api) | JSON HTTP API over the core's query service, mounted at `/argus-api`. |
| `@codysseydev/argus-ui` | [argus-ui](https://github.com/codysseydev/argus-ui) | React SPA (vendored here in `ui/`), served at `/argus`. |

None of those three runs on its own; they are libraries that need a host app. This
repo is that host, plus demo jobs and a traffic simulator so every screen has real
data to show.

```
React SPA (/argus)  ->  argus-api (/argus-api)  ->  argus core  ->  Postgres
   served by Laravel       JSON over HTTP            query service     (store)

queued jobs  ->  Horizon workers  ->  Argus captures queue events  ->  Valkey buffer
                                                                          |
                                                          argus:ship drains to Postgres
```

The whole stack runs in Docker via [Spin](https://serversideup.net/open-source/spin/):
Traefik, PHP, Postgres 18, Valkey 9, Horizon (queue), the Argus shipper, and the
Laravel scheduler.

## Prerequisites

- Docker (Docker Desktop or OrbStack) running
- [Spin](https://serversideup.net/open-source/spin/) installed (`spin` on your PATH)
- The three Argus repos cloned **as siblings** of this one, because the demo
  pulls them in through local path references:

  ```
  your-code-dir/
    argus/
    argus-api/
    argus-ui/
    argus-demo/   <- you are here
  ```

> Why siblings? The demo consumes the packages from the local working copies (via
> a composer `path` repository for the PHP packages and a vendored copy of the UI
> source). This keeps the demo pinned to exactly what you are developing. To run
> against the published releases instead, see [Using published packages](#using-published-packages).

## Quick start

```bash
cp .env.example .env
make up                # build + start every service
make fresh             # migrate + seed the demo user
make simulate          # dispatch ~240 demo jobs across 4 tenants
```

Then open the dashboard and sign in:

- URL: **https://localhost:8443/argus**
- Email: `demo@argus.test`
- Password: `password`

> **Port note.** The defaults bind Traefik to host ports 80/443 and route
> `argus.dev.test`. If another Traefik already owns those ports (common when you
> run several Spin projects), this repo's `.env.example` ships alternate ports
> (`HTTP_PORT=8090`, `HTTPS_PORT=8443`) and routes `localhost`, so you reach it at
> `https://localhost:8443`. The TLS cert is the Server Side Up local CA (already
> trusted if you use Spin). Edit those vars to use 80/443 and `argus.dev.test`.

## What you'll see

- **Search** (`/argus/search`) — every recorded job with a filter builder (tenant,
  status, job class, attempts, time window, correlation key/value). Filter state
  lives in the URL.
- **Job history** (`/argus/jobs/:uuid`) — the full ordered transition timeline for
  one job, including retries (released) before a terminal state.
- **Failures** (`/argus/failures`) — failures grouped by exception fingerprint.
  The demo produces three distinct fingerprints (payment declined, CRM
  unavailable, avatar processing).
- **Saved searches / alerts** (`/argus/saved-searches`) — create saved searches
  and attach threshold alert rules.

Horizon's own dashboard is at `https://localhost:8443/horizon`.

## How the pieces are wired

- **Storage**: `ARGUS_STORE=postgres`, buffered through Valkey 9 (`REDIS_HOST=valkey`).
- **Queue**: `QUEUE_CONNECTION=redis`; Horizon supervises the demo queues
  (`emails`, `reports`, `billing`, `crm`, `media`). Argus captures the standard
  Laravel queue events the workers emit.
- **Shipper**: the `argus-ship` container runs `php artisan argus:ship`, draining
  buffered transitions into Postgres.
- **Auth**: `ARGUS_API_GUARD=web` and the API routes carry the `web` middleware
  group. The SPA is served same-origin (`/argus`) with the API (`/argus-api`), so
  a logged-in session authorizes every request via its cookie + `X-XSRF-TOKEN`.
  There is no token flow; the SPA rides the Laravel session.
- **Tenant + correlation**: `App\Argus\DemoTenantResolver` reports each job's
  tenant; the correlation whitelist captures `request_id`, `trace_id`, `tenant_id`.

## Common tasks

```bash
make simulate JOBS=500   # more traffic
make fresh               # wipe recorded jobs and re-seed
make ui                  # rebuild the SPA into public/argus
make logs                # tail all services
make horizon             # Horizon status
make down                # stop everything
```

The demo jobs live in `app/Jobs/Demo/`, the simulator in
`app/Console/Commands/SimulateTraffic.php`.

## Rebuilding the UI

The SPA source is vendored under `ui/` (a copy of `argus-ui` with one change: an
env-driven base path so it can be served under `/argus`). The built bundle in
`public/argus/` is committed so the app renders on a fresh clone without a node
step. To rebuild after changing `ui/`:

```bash
make ui
```

## Using published packages

To run against the released packages instead of local siblings, replace the path
repositories in `composer.json` with the Packagist versions and require them
normally, then `composer update`. The UI can be installed from its published
artifact rather than the vendored `ui/` copy.

## Deploying to Laravel Cloud

The Spin layout includes production Docker stages (`Dockerfile.php` `deploy`
target) for a future Laravel Cloud / Swarm deploy. That path is not wired up yet.
