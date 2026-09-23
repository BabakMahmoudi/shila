# Shila — Deployment Guide (Cloudflare)

This document describes how to deploy Shila to Cloudflare. Shila is a pnpm
monorepo with two deployable units:

| Unit | Path | Runtime |
| --- | --- | --- |
| API | `apps/worker` | Cloudflare Workers (Hono) |
| Web | `apps/web` | Cloudflare Pages (React + Vite SPA) |
| Shared types | `packages/contracts` | consumed by both (built from source) |

Shared schemas are imported as TypeScript source (`"main": "./src/index.ts"`),
so both the Worker and the Vite build consume them directly — there is no
separate package build/publish step.

## 1. Deployment topology

```
                 ┌────────────────────────────┐
  Browser ─────▶ │  Cloudflare Pages (web)    │
                 │  apps/web/dist             │
                 └──────────────┬─────────────┘
                                │ HTTPS (/api/* or full worker URL)
                                ▼
                 ┌────────────────────────────┐
                 │  Cloudflare Worker (API)   │
                 │  apps/worker (Hono)        │
                 └───┬──────────┬─────────────┘
                     │          │
                     ▼          ▼
             Cloudflare D1   LLM provider (DeepSeek / OpenAI)
             (transactions,  (OpenAI-compatible chat API)
              messages, context)
```

- **D1** holds `users`, `transactions`, `messages` (conversation history), and
  `context`. This is the only stateful service to provision.
- **LLM access** is configured through environment variables; the model provider
  is selected at runtime by `SHILA_MODEL_PROVIDER` (`deepseek` is the default).
- **Auth is currently a placeholder**: every request resolves to the seeded
  `dev-user` (`apps/worker/src/auth/placeholder.ts`). Google OAuth is not wired
  up yet, so there are no OAuth secrets to configure.

## 2. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/).
- Node.js ≥ 20 and [pnpm](https://pnpm.io/) ≥ 9 (`corepack enable` will do).
- `wrangler` (used via `pnpm`; the workspace pins it in `apps/worker`).

Authenticate Wrangler once per machine:

```bash
pnpm dlx wrangler login
```

## 3. Install dependencies

```bash
pnpm install
```

## 4. Provision the D1 database

D1 is the source of truth for financial records and conversation history. The
schema lives in `apps/worker/migrations/` and is applied with Wrangler.

### 4.1 Create the database

```bash
pnpm --filter @shila/worker exec wrangler d1 create shila-db
```

The command prints a `database_id`. Copy it into
`apps/worker/wrangler.toml`, replacing the placeholder:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shila-db"
database_id = "<paste-your-real-id>"
migrations_dir = "migrations"
```

> The committed `database_id` is a placeholder (`0000…0000`). It is only
> ignored for local `wrangler dev` / tests; **you must set the real id before
> deploying**, otherwise production requests will fail to reach the database.

### 4.2 Apply migrations

```bash
# Local (Miniflare-backed, used by `wrangler dev` and tests)
pnpm --filter @shila/worker db:migrate:local

# Remote (the production D1 database)
pnpm --filter @shila/worker db:migrate:remote
```

These scripts are defined in `apps/worker/package.json` and map to
`wrangler d1 migrations apply shila-db --local` / `--remote`.

## 5. Configure the Worker

### 5.1 Environment variables (non-secret)

Already present in `apps/worker/wrangler.toml`:

```toml
[vars]
SHILA_MODEL_PROVIDER = "deepseek"
```

Available settings (`apps/worker/src/types.ts`):

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `SHILA_MODEL_PROVIDER` | no | `deepseek` | LLM adapter: `deepseek` or `openai`. |
| `SHILA_MODEL` | no | provider default | Model override (`deepseek-chat`, `gpt-4o-mini`, …). |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com/v1` | Override the DeepSeek endpoint. |
| `OPENAI_BASE_URL` | no | OpenAI default | Override the OpenAI endpoint. |

### 5.2 Secrets

Secrets must **never** be committed. Set them in production with
`wrangler secret put` (interactive — it prompts for the value):

```bash
pnpm --filter @shila/worker exec wrangler secret put DEEPSEEK_API_KEY
```

| Secret | Required | Description |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | yes (if using DeepSeek) | API key for `api.deepseek.com`. |
| `OPENAI_API_KEY` | yes (if using OpenAI) | API key for OpenAI. |

For **local development**, copy `apps/worker/.dev.vars.example` to
`apps/worker/.dev.vars` and fill it in. `.dev.vars` is gitignored.

### 5.3 Verify locally (optional)

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars   # then edit it
pnpm --filter @shila/worker db:migrate:local
pnpm --filter @shila/worker dev                            # http://localhost:8787
```

`GET http://localhost:8787/health` should return `200`.

## 6. Deploy the Worker

```bash
pnpm --filter @shila/worker deploy
```

This runs `wrangler deploy` (`apps/worker/package.json`). Wrangler reports the
deployed URL, e.g. `https://shila-worker.<your-account>.workers.dev`. Record it —
the web app needs it in the next step.

Confirm the deployment:

```bash
curl https://shila-worker.<your-account>.workers.dev/health
```

## 7. Deploy the Web app (Pages)

Build the SPA, then publish the `dist` output to Pages:

```bash
pnpm --filter @shila/web build
pnpm dlx wrangler pages deploy apps/web/dist --project-name shila-web
```

The first `wrangler pages deploy` creates the Pages project `shila-web`; set the
production branch when prompted (or later in the dashboard). Subsequent runs
update it. Alternatively, connect the repo to Cloudflare Pages via the dashboard
using:

- **Build command:** `pnpm --filter @shila/web build`
- **Output directory:** `apps/web/dist`

## 8. Point the web app at the API

In development, Vite proxies `/api/*` to `http://localhost:8787` and strips the
`/api` prefix (`apps/web/vite.config.ts`). There is no such proxy on a static
Pages deployment, so you must tell the frontend where the Worker lives. The API
client reads a single constant in `apps/web/src/api/client.ts`:

```ts
const API_BASE = "/api";
```

Two supported approaches:

### 8.1 Same-origin (recommended for production)

Serve both units on one hostname and route `/api/*` to the Worker, keeping the
frontend's `/api` base unchanged. This avoids CORS entirely.

1. Add a route for the API Worker on your zone in `apps/worker/wrangler.toml`:

   ```toml
   routes = [
     { pattern = "app.example.com/api/*", zone_name = "example.com" }
   ]
   ```

   Re-deploy the Worker (`pnpm --filter @shila/worker deploy`).

2. Exclude `/api/*` from the Pages asset-serving Worker so those requests fall
   through to the API Worker route. Create `apps/web/public/_routes.json`:

   ```json
   {
     "version": 1,
     "include": ["/*"],
     "exclude": ["/api/*"]
   }
   ```

   Rebuild and redeploy Pages. Because the Worker routes are mounted at
   `/health` and `/chat` (not `/api/…`), you must also mount the API under the
   `/api` base path (e.g. `app.route("/api/chat", chatRoute)` in
   `apps/worker/src/index.ts`) and drop the Vite dev rewrite, so dev and prod
   share the same shape.

### 8.2 Cross-origin (quickest, CORS already enabled)

The Worker has a global `cors()` middleware (`apps/worker/src/index.ts`), so the
browser may call it directly from a different origin. Point the SPA at the
deployed Worker URL:

```ts
const API_BASE = "https://shila-worker.<your-account>.workers.dev";
```

Or make it configurable at build time by adding a Vite env var:

```ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
```

and building with:

```bash
VITE_API_BASE=https://shila-worker.<your-account>.workers.dev pnpm --filter @shila/web build
```

> Note: when calling cross-origin, the full Worker URL must not include a
> trailing `/api` because the Worker routes are at the root (`/chat`, `/health`).

## 9. Environments (staging / production)

`wrangler.toml` currently defines a single environment. To separate staging from
production, add `[env.staging]` / `[env.production]` blocks with their own
`[vars]`, `routes`, and D1 `database_id`, then deploy with `--env`:

```bash
pnpm --filter @shila/worker exec wrangler deploy --env staging
pnpm --filter @shila/worker exec wrangler secret put DEEPSEEK_API_KEY --env staging
```

Secrets are per-environment: set them for each `--env` you deploy.

## 10. Rollback

- **Worker:** Wrangler keeps version history.
  ```bash
  pnpm --filter @shila/worker exec wrangler rollback
  ```
  or specify a version id: `wrangler rollback <version-id>`.
- **Pages:** redeploy a previous build from the Cloudflare dashboard
  (Pages → project → Deployments → “Rollback”), or re-publish a known-good
  `dist` with `wrangler pages deploy`.
- **D1:** migrations are forward-only. Take a manual backup before a schema
  change if a rollback might be needed:
  ```bash
  pnpm --filter @shila/worker exec wrangler d1 export shila-db --remote --output backup.sql
  ```

## 11. Deployment checklist

- [ ] `wrangler login` succeeds (`wrangler whoami`).
- [ ] `pnpm install` completes.
- [ ] D1 database created; real `database_id` set in `wrangler.toml`.
- [ ] `db:migrate:remote` applied without error.
- [ ] `DEEPSEEK_API_KEY` (and/or `OPENAI_API_KEY`) set via `wrangler secret put`.
- [ ] `SHILA_MODEL_PROVIDER` / `SHILA_MODEL` set as intended.
- [ ] Worker deployed; `/health` returns 200.
- [ ] Web built and deployed to Pages.
- [ ] Frontend API base points at the Worker (same-origin or cross-origin).
- [ ] A chat message produces a transaction or a clarification (end-to-end check).

## 12. Troubleshooting

- **`D1_ERROR` / database unreachable in production:** the `database_id` is still
  the placeholder, or migrations were never applied remotely. Re-check
  `wrangler.toml` and run `db:migrate:remote`.
- **`500` with an LLM error in chat:** a required API key secret is unset for
  the deployed environment, or `SHILA_MODEL_PROVIDER` names an adapter you
  haven't configured a key for.
- **CORS errors in the browser:** you are calling cross-origin but the request
  path/URL is wrong; confirm the `API_BASE` points at the Worker origin (no
  `/api` suffix) and that the Worker's `cors()` middleware is present.
- **`/api` requests 404 on the Pages domain:** Pages is intercepting `/api`
  instead of forwarding to the Worker; add `apps/web/public/_routes.json` with
  the `/api/*` exclusion and re-deploy.
- **Auth is always `dev-user`:** expected. Google OAuth is intentionally
  deferred; see `apps/worker/src/auth/placeholder.ts`.
