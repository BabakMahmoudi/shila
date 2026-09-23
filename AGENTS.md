# Shila — Agent Guide

## What this is

Shila is a Persian-language personal assistant built on LLMs, starting as a **personal accountant**. Users describe daily expenses in chat or by voice; Shila extracts structured financial records and stores them in Cloudflare D1.

Full design, data model, and roadmap live in `ARCHITECTURE.md`. This file is the concise operating manual for coding agents.

## Stack

- **Language**: TypeScript everywhere, strict mode.
- **API**: Cloudflare Workers + Hono.
- **Frontend**: React + Vite, RTL Persian PWA (Cloudflare Pages).
- **Storage**: Cloudflare D1 (financial transactions), Cloudflare Agent Memory (conversations + context).
- **Auth**: Google OAuth/OIDC.
- **LLM**: model-agnostic gateway (adapters: Anthropic Claude, OpenAI GPT, Google Gemini). Selected via `SHILA_MODEL_PROVIDER`.
- **Voice**: Google Speech-to-Text / Text-to-Speech (Persian `fa-IR`).
- **Package manager**: pnpm workspaces (monorepo).

## Commands

Target command set once the monorepo is scaffolded (no `package.json` exists yet):

```bash
pnpm install          # install all workspaces
pnpm dev              # run worker (wrangler dev) + web (vite) together
pnpm build            # build web + typecheck worker
pnpm typecheck        # tsc --noEmit across workspaces
pnpm lint             # eslint across workspaces
pnpm test             # vitest
pnpm deploy           # wrangler deploy (worker) + pages deploy (web)
```

Run typecheck and lint after any change. Do not add these commands to the docs yourself; wire them up when scaffolding.

## Layout

```
apps/web       React PWA — chat UI, auth, mic capture
apps/worker    Cloudflare Worker — Hono routes, LLM gateway, services, D1
packages/contracts  Shared TS types + Zod schemas (transaction, chat)
```

- `apps/worker/src/llm` — LLM gateway + provider adapters. Never import a provider SDK outside this directory.
- `apps/worker/src/db` — D1 schema and queries.
- `packages/contracts` — the single source of truth for the transaction/extraction schema; both worker and web import from here.

## Conventions

- **Persian first**: user-facing strings and prompts are Persian, RTL in the UI. Code, comments (where unavoidable), and identifiers are English.
- **Never invent financial data**: extraction must return a `clarification` request rather than guessing amount, currency, or counterparty. See `ARCHITECTURE.md` §7.
- **Amounts are integer Toman** (1 KT = 1,000 Toman). No floats for money.
- **Shared schemas via Zod** in `packages/contracts`; validate LLM output before persisting.
- **Transactions belong to a user** (`user_id`); every query is scoped by the authenticated user.
- **Environment over hard-coding**: model provider, Google keys, OAuth client, D1 binding are all configured via `wrangler.toml` / secrets, not literals.

## Docs

- `ARCHITECTURE.md` — components, data model, key flows, extraction contract, roadmap, open questions.
- `idea.txt` — original product idea and early notes.

## Network
- It may happen that my internet connection be filtered by government. If it seems that general tools like npm deos not work
  or you feel strange network behaviour you may use this proxy http:/localhost:2352 both for http and https/
